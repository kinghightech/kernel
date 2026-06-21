// Edge Function: square-oauth
// Handles the whole Square "Connect your account" flow. One function, four jobs,
// picked by the last bit of the URL path:
//
//   POST /functions/v1/square-oauth/start       (needs the user's login token)
//        -> returns { url }: the Square page we send the seller to.
//   GET  /functions/v1/square-oauth/callback     (Square redirects the browser here)
//        -> swaps the one-time code for tokens, saves them, bounces the browser
//           back into the app.
//   GET  /functions/v1/square-oauth/status       (needs the user's login token)
//        -> returns { connected, connection } for the UI (never returns tokens).
//   POST /functions/v1/square-oauth/disconnect   (needs the user's login token)
//        -> revokes at Square and deletes the local connection.
//
// This function runs with verify_jwt = false because Square's browser redirect
// to /callback cannot carry our login token. For the other three actions we
// check the user's token by hand (same approach as upload-asset).
//
// SANDBOX vs PRODUCTION: nothing here changes between the two. We read SQUARE_ENV
// and the matching app credentials from secrets. Going live = set SQUARE_ENV to
// "production" and swap SQUARE_APP_ID / SQUARE_APP_SECRET to the production pair.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

// --- Square configuration (all from secrets) -------------------------------
const SQUARE_ENV = (Deno.env.get('SQUARE_ENV') ?? 'sandbox').toLowerCase()
const IS_PROD = SQUARE_ENV === 'production'
const SQUARE_BASE = IS_PROD
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com'
const APP_ID = Deno.env.get('SQUARE_APP_ID') ?? ''
const APP_SECRET = Deno.env.get('SQUARE_APP_SECRET') ?? ''
const SQUARE_VERSION = '2025-01-23'

// Read-only permissions we ask the seller to grant. '+' is Square's separator.
const SCOPES = [
  'MERCHANT_PROFILE_READ', // business info, locations, timezone, currency
  'PAYMENTS_READ',         // payments (for revenue)
  'ORDERS_READ',           // orders / line items (what they sold)
  'ITEMS_READ',            // catalog (products & services)
  'INVENTORY_READ',        // stock counts
  'CUSTOMERS_READ',        // customer directory
].join('+')

// --- Supabase (service role: bypasses RLS, server-only) --------------------
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/square-oauth/callback`

const admin = () =>
  createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const action = url.pathname.split('/').pop() // last path segment

  try {
    if (action === 'start') return await handleStart(req)
    if (action === 'callback') return await handleCallback(url)
    if (action === 'status') return await handleStatus(req)
    if (action === 'disconnect') return await handleDisconnect(req)
    return json({ error: `Unknown action "${action}".` }, 404)
  } catch (err) {
    console.error('square-oauth error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})

// --- helpers ---------------------------------------------------------------

// Identify the logged-in caller from the bearer token they sent.
async function userFromRequest(req: Request) {
  const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!jwt) return null
  const { data: { user } } = await admin().auth.getUser(jwt)
  return user ?? null
}

// 64-char random hex string used as the CSRF `state`.
function randomState() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

// --- 1) START: build the Square authorization URL --------------------------
async function handleStart(req: Request) {
  if (!APP_ID || !APP_SECRET) return json({ error: 'Square app credentials are not configured.' }, 500)

  const user = await userFromRequest(req)
  if (!user) return json({ error: 'Not authenticated.' }, 401)

  // Where to send the browser back to after Square is done.
  let redirectTo = SUPABASE_URL
  try {
    const body = await req.json()
    if (body?.redirect_to) redirectTo = String(body.redirect_to)
  } catch { /* empty body is fine */ }

  // Remember this attempt so the public callback can prove who it belongs to.
  const state = randomState()
  const { error } = await admin()
    .from('square_oauth_states')
    .insert({ state, user_id: user.id, redirect_to: redirectTo })
  if (error) return json({ error: error.message }, 500)

  const authUrl =
    `${SQUARE_BASE}/oauth2/authorize` +
    `?client_id=${encodeURIComponent(APP_ID)}` +
    `&scope=${SCOPES}` +
    `&session=false` +
    `&state=${state}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`

  return json({ url: authUrl }, 200)
}

// --- 2) CALLBACK: Square sends the browser back with ?code & ?state ---------
async function handleCallback(url: URL) {
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const sqError = url.searchParams.get('error')

  // Resolve who started this and where to bounce them back to.
  let redirectTo = SUPABASE_URL
  let userId: string | null = null
  if (state) {
    const { data } = await admin()
      .from('square_oauth_states').select('*').eq('state', state).maybeSingle()
    if (data) {
      userId = data.user_id
      redirectTo = data.redirect_to ?? redirectTo
      await admin().from('square_oauth_states').delete().eq('state', state) // one-time use
    }
  }

  const bounce = (status: string) => {
    let target: string
    try {
      const u = new URL(redirectTo)
      u.searchParams.set('square', status)
      target = u.toString()
    } catch {
      target = `${SUPABASE_URL}?square=${status}`
    }
    return Response.redirect(target, 302)
  }

  if (sqError || !code || !state || !userId) {
    console.error('callback rejected:', { sqError, hasCode: !!code, hasState: !!state, userId })
    return bounce('error')
  }

  // Swap the one-time code for tokens. This is server-to-server and uses our
  // secret — it never touches the browser.
  const tokenRes = await fetch(`${SQUARE_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Square-Version': SQUARE_VERSION },
    body: JSON.stringify({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  })
  const token = await tokenRes.json()
  if (!tokenRes.ok || !token.access_token) {
    console.error('token exchange failed:', token)
    return bounce('error')
  }

  // Pull business name / currency / timezone from the seller's first location.
  let businessName: string | null = null
  let currency: string | null = null
  let timezone: string | null = null
  let mainLocationId: string | null = null
  try {
    const locRes = await fetch(`${SQUARE_BASE}/v2/locations`, {
      headers: { Authorization: `Bearer ${token.access_token}`, 'Square-Version': SQUARE_VERSION },
    })
    const first = (await locRes.json())?.locations?.[0]
    if (first) {
      businessName = first.business_name ?? first.name ?? null
      currency = first.currency ?? null
      timezone = first.timezone ?? null
      mainLocationId = first.id ?? null
    }
  } catch (e) {
    console.error('locations fetch failed (continuing):', e)
  }

  const { error } = await admin().from('square_connections').upsert({
    user_id: userId,
    merchant_id: token.merchant_id ?? null,
    business_name: businessName,
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_expires_at: token.expires_at ?? null,
    scopes: SCOPES.split('+'),
    environment: SQUARE_ENV,
    currency,
    timezone,
    main_location_id: mainLocationId,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
  if (error) {
    console.error('save failed:', error)
    return bounce('error')
  }

  return bounce('connected')
}

// --- 3) STATUS: is this user connected? (no tokens leaked) ------------------
async function handleStatus(req: Request) {
  const user = await userFromRequest(req)
  if (!user) return json({ error: 'Not authenticated.' }, 401)

  const { data } = await admin()
    .from('square_connections')
    .select('business_name, merchant_id, environment, currency, timezone, connected_at, scopes')
    .eq('user_id', user.id)
    .maybeSingle()

  return json({ connected: !!data, connection: data ?? null }, 200)
}

// --- 4) DISCONNECT: revoke at Square, then forget locally -------------------
async function handleDisconnect(req: Request) {
  const user = await userFromRequest(req)
  if (!user) return json({ error: 'Not authenticated.' }, 401)

  const { data } = await admin()
    .from('square_connections').select('access_token').eq('user_id', user.id).maybeSingle()

  if (data?.access_token) {
    try {
      await fetch(`${SQUARE_BASE}/oauth2/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Square-Version': SQUARE_VERSION,
          Authorization: `Client ${APP_SECRET}`, // revoke authenticates with the app secret
        },
        body: JSON.stringify({ client_id: APP_ID, access_token: data.access_token }),
      })
    } catch (e) {
      console.error('revoke failed (continuing):', e)
    }
  }

  await admin().from('square_connections').delete().eq('user_id', user.id)
  return json({ disconnected: true }, 200)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
