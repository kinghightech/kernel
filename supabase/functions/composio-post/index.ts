// Edge Function: composio-post
// Executes a Composio action on a connected social account — this is what runs
// when a business owner clicks "Approve & Post". The approval gate lives in
// your UI; this function just performs the action they approved.
//
//   POST /functions/v1/composio-post/tools     (needs the user's login token)
//        body: { platform: "instagram" }
//        -> returns the available action slugs + input schemas for that
//           platform, so you can wire the right action without guessing.
//   POST /functions/v1/composio-post/execute   (needs the user's login token)
//        body: { tool: "INSTAGRAM_...", arguments: { ... } }
//        -> runs the action as THIS user (their connected account) and returns
//           Composio's result.
//
// Same auth/secret model as composio-connect: COMPOSIO_API_KEY is a Supabase
// secret; the Composio userId is the Supabase user.id.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Composio } from 'npm:@composio/core@0.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const ALLOWED_PLATFORMS = new Set(['instagram', 'tiktok', 'youtube'])

const COMPOSIO_API_KEY = Deno.env.get('COMPOSIO_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const admin = () =>
  createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
const composio = () => new Composio({ apiKey: COMPOSIO_API_KEY })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const action = new URL(req.url).pathname.split('/').pop()
  try {
    if (!COMPOSIO_API_KEY) return json({ error: 'COMPOSIO_API_KEY is not configured.' }, 500)
    if (action === 'tools') return await handleTools(req)
    if (action === 'execute') return await handleExecute(req)
    if (action === 'instagram-publish') return await handleInstagramPublish(req)
    return json({ error: `Unknown action "${action}".` }, 404)
  } catch (err) {
    console.error('composio-post error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})

async function userFromRequest(req: Request) {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!jwt) return null
  const { data: { user } } = await admin().auth.getUser(jwt)
  return user ?? null
}

// --- Discover the available action slugs for a platform --------------------
async function handleTools(req: Request) {
  const user = await userFromRequest(req)
  if (!user) return json({ error: 'Not authenticated.' }, 401)

  const body = await req.json().catch(() => ({}))
  const platform = String(body?.platform ?? '').toLowerCase()
  if (!ALLOWED_PLATFORMS.has(platform)) return json({ error: `Unsupported platform "${platform}".` }, 400)

  const tools = await composio().tools.getRawComposioTools({ toolkits: [platform] })
  const summary = (tools ?? []).map((t: { slug?: string; name?: string; description?: string }) => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
  }))
  return json({ platform, tools: summary }, 200)
}

// --- Execute an approved action on the user's connected account ------------
async function handleExecute(req: Request) {
  const user = await userFromRequest(req)
  if (!user) return json({ error: 'Not authenticated.' }, 401)

  const body = await req.json().catch(() => ({}))
  const tool = String(body?.tool ?? '')
  const args = (body?.arguments ?? {}) as Record<string, unknown>
  if (!tool) return json({ error: 'Missing "tool" slug.' }, 400)

  const result = await composio().tools.execute(tool, {
    userId: user.id,        // acts as this business's connected account
    arguments: args,
  })

  return json({ result }, 200)
}

// --- Publish a single-image Instagram post (2-step: create container, publish)
// body: { caption, imageUrl, igUserId? }
//   igUserId is the Instagram Business Account ID. We store it on first use so
//   the owner only ever enters it once. Instagram fetches imageUrl itself, so it
//   must be a public URL.
async function handleInstagramPublish(req: Request) {
  const user = await userFromRequest(req)
  if (!user) return json({ error: 'Not authenticated.' }, 401)

  const body = await req.json().catch(() => ({}))
  const caption = String(body?.caption ?? '')
  const imageUrl = String(body?.imageUrl ?? '')
  if (!imageUrl) return json({ error: 'An image URL is required.' }, 400)

  // Resolve the IG Business Account id: prefer the one passed in (and remember
  // it), otherwise fall back to the stored value.
  let igUserId = String(body?.igUserId ?? '').trim()
  const { data: row } = await admin()
    .from('social_connections')
    .select('ig_user_id')
    .eq('user_id', user.id).eq('platform', 'instagram')
    .maybeSingle()

  if (igUserId) {
    await admin().from('social_connections')
      .update({ ig_user_id: igUserId, updated_at: new Date().toISOString() })
      .eq('user_id', user.id).eq('platform', 'instagram')
  } else {
    igUserId = row?.ig_user_id ?? ''
  }
  if (!igUserId) {
    return json({ error: 'Missing Instagram Business Account ID (ig_user_id).' }, 400)
  }

  const client = composio()

  // Composio requires an explicit toolkit version for manual execution.
  const tools = await client.tools.getRawComposioTools({ toolkits: ['instagram'] })
  const version = (tools ?? [])[0]?.version as string | undefined

  // Step 1 — create the media container.
  const created = await client.tools.execute('INSTAGRAM_POST_IG_USER_MEDIA', {
    userId: user.id,
    version,
    arguments: { ig_user_id: igUserId, image_url: imageUrl, caption },
  })
  if (created.successful === false) {
    return json({ error: `Create failed: ${created.error ?? 'unknown error'}` }, 502)
  }
  const data = (created.data ?? {}) as Record<string, unknown>
  const creationId = (data.id ?? data.creation_id ?? (data.response as Record<string, unknown>)?.id) as string | undefined
  if (!creationId) {
    return json({ error: 'No creation_id returned from Instagram.', raw: created.data }, 502)
  }

  // Step 2 — publish the container.
  const published = await client.tools.execute('INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH', {
    userId: user.id,
    version,
    arguments: { ig_user_id: igUserId, creation_id: creationId },
  })
  if (published.successful === false) {
    return json({ error: `Publish failed: ${published.error ?? 'unknown error'}` }, 502)
  }

  return json({ result: published.data, creationId }, 200)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
