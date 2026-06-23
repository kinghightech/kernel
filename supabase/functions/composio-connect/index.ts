// Edge Function: composio-connect
// Lets a business owner connect a social account (Instagram/TikTok/YouTube)
// through Composio. Composio handles the OAuth dance and stores the tokens —
// we only keep a lightweight row in `social_connections` for the UI.
//
//   POST /functions/v1/composio-connect/start       (needs the user's login token)
//        body: { platform: "instagram"|"tiktok"|"youtube" }
//        -> returns { url, connectionId }: open `url` in a popup for the owner
//           to authorize. We store a 'pending' row.
//   POST /functions/v1/composio-connect/status       (needs the user's login token)
//        -> asks Composio which accounts this user has connected, syncs our
//           table, and returns { connections: [{ platform, status, label }] }.
//   POST /functions/v1/composio-connect/disconnect   (needs the user's login token)
//        body: { platform }
//        -> deletes the Composio connection and our row.
//
// Composio's userId is the Supabase user.id, so every connection is naturally
// scoped to one business. The COMPOSIO_API_KEY is a Supabase secret — it never
// reaches the browser. (Use a SEPARATE key from any personal Claude Code key.)
//
// verify_jwt is left at its default; we check the caller's token by hand below,
// mirroring the square-oauth / upload-asset pattern.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { Composio } from 'npm:@composio/core@0.11.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// Toolkits we allow the UI to request. Add more here as you expand.
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
    if (action === 'start') return await handleStart(req)
    if (action === 'status') return await handleStatus(req)
    if (action === 'disconnect') return await handleDisconnect(req)
    return json({ error: `Unknown action "${action}".` }, 404)
  } catch (err) {
    console.error('composio-connect error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})

// Identify the logged-in caller from their bearer token.
async function userFromRequest(req: Request) {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!jwt) return null
  const { data: { user } } = await admin().auth.getUser(jwt)
  return user ?? null
}

// --- 1) START: get the Composio authorization URL --------------------------
async function handleStart(req: Request) {
  const user = await userFromRequest(req)
  if (!user) return json({ error: 'Not authenticated.' }, 401)

  const body = await req.json().catch(() => ({}))
  const platform = String(body?.platform ?? '').toLowerCase()
  if (!ALLOWED_PLATFORMS.has(platform)) {
    return json({ error: `Unsupported platform "${platform}".` }, 400)
  }

  // Find an auth config for this toolkit on the account. Composio provides a
  // managed one by default; for production you'd create your own (your OAuth
  // app / branding) and it would show up here too.
  const client = composio()
  const configs = await client.authConfigs.list({ toolkit: platform })
  const authConfigId = (configs?.items ?? [])[0]?.id
  if (!authConfigId) {
    return json({
      error: `No auth config found for "${platform}". Enable the ${platform} toolkit in your Composio dashboard.`,
    }, 400)
  }

  // Create a Connect Link (the old toolkits.authorize endpoint is retired).
  const conn = await client.connectedAccounts.link(user.id, authConfigId)
  const redirectUrl = conn.redirectUrl
  if (!redirectUrl) {
    return json({ error: 'Composio did not return an authorization URL.' }, 502)
  }

  // Record a pending connection so the UI can reflect "connecting…".
  await admin().from('social_connections').upsert({
    user_id: user.id,
    platform,
    connected_account_id: conn.id,
    status: 'pending',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,platform' })

  return json({ url: redirectUrl, connectionId: conn.id }, 200)
}

// --- 2) STATUS: sync from Composio, return what's connected ----------------
async function handleStatus(req: Request) {
  const user = await userFromRequest(req)
  if (!user) return json({ error: 'Not authenticated.' }, 401)

  // Composio is the source of truth for connection state.
  const { items } = await composio().connectedAccounts.list({ userIds: [user.id] })

  const connections = (items ?? [])
    .filter((a) => ALLOWED_PLATFORMS.has(a.toolkit?.slug))
    .map((a) => ({
      platform: a.toolkit.slug,
      status: String(a.status).toLowerCase() === 'active' ? 'active' : String(a.status).toLowerCase(),
      connected_account_id: a.id,
      label: a.alias ?? null,
    }))

  // Mirror into our table so the frontend can also read it directly via RLS.
  for (const c of connections) {
    await admin().from('social_connections').upsert({
      user_id: user.id,
      platform: c.platform,
      connected_account_id: c.connected_account_id,
      status: c.status === 'active' ? 'active' : 'pending',
      account_label: c.label,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,platform' })
  }

  return json({ connections }, 200)
}

// --- 3) DISCONNECT: remove at Composio, then forget locally ----------------
async function handleDisconnect(req: Request) {
  const user = await userFromRequest(req)
  if (!user) return json({ error: 'Not authenticated.' }, 401)

  const body = await req.json().catch(() => ({}))
  const platform = String(body?.platform ?? '').toLowerCase()
  if (!ALLOWED_PLATFORMS.has(platform)) return json({ error: `Unsupported platform "${platform}".` }, 400)

  const { data } = await admin()
    .from('social_connections')
    .select('connected_account_id')
    .eq('user_id', user.id).eq('platform', platform)
    .maybeSingle()

  if (data?.connected_account_id) {
    try {
      await composio().connectedAccounts.delete(data.connected_account_id)
    } catch (e) {
      console.error('composio delete failed (continuing):', e)
    }
  }

  await admin().from('social_connections').delete()
    .eq('user_id', user.id).eq('platform', platform)

  return json({ disconnected: true }, 200)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
