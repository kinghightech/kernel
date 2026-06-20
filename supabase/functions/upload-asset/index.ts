// Edge Function: upload-asset
// Uploads a logo or product image to the `business-assets` storage bucket.
//
// Why this exists instead of a direct browser -> storage upload:
// direct client uploads were being rejected by storage RLS ("new row violates
// row-level security policy") even for the file's rightful owner. This function
// runs only for authenticated users (verify_jwt), derives the user id from their
// verified token, and writes with the service role (which bypasses storage RLS).
// The destination path is ALWAYS forced under "<user_id>/", so a user can still
// only ever write into their own folder.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const BUCKET = 'business-assets'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!jwt) return json({ error: 'Missing authorization.' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

    // Identify the caller from their verified token.
    const { data: { user }, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !user) return json({ error: 'Not authenticated.' }, 401)

    const form = await req.formData()
    const file = form.get('file')
    const kind = String(form.get('kind') ?? 'asset')
    if (!(file instanceof File)) return json({ error: 'No file provided.' }, 400)

    const ext = (file.name.split('.').pop() || file.type.split('/').pop() || 'png')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'png'
    const stamp = `${Date.now()}-${Math.round(Math.random() * 1e6)}`

    // Path is ALWAYS confined to the caller's own folder.
    const path =
      kind === 'product'
        ? `${user.id}/products/product-${stamp}.${ext}`
        : `${user.id}/logo-${stamp}.${ext}`

    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    })
    if (upErr) {
      console.error('upload failed:', upErr)
      return json({ error: upErr.message }, 500)
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path)
    return json({ url: publicUrl }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: (err as Error).message }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
