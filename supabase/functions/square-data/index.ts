// Edge Function: square-data
// Reads a connected seller's Square account and returns a compact summary the
// dashboard + AI can use: today's & last-7-days revenue, top items sold,
// catalog size, and customer count. If the stored access token has expired it
// is silently refreshed first.
//
// Requires the user's login token (verify_jwt handled by hand, like the rest).
// Sandbox vs production is controlled by the same SQUARE_ENV secret as
// square-oauth — no code changes between them.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SQUARE_ENV = (Deno.env.get('SQUARE_ENV') ?? 'sandbox').toLowerCase()
const SQUARE_BASE = SQUARE_ENV === 'production'
  ? 'https://connect.squareup.com'
  : 'https://connect.squareupsandbox.com'
const APP_ID = Deno.env.get('SQUARE_APP_ID') ?? ''
const APP_SECRET = Deno.env.get('SQUARE_APP_SECRET') ?? ''
const SQUARE_VERSION = '2025-01-23'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = () =>
  createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

interface Connection {
  user_id: string
  access_token: string
  refresh_token: string
  token_expires_at: string | null
  currency: string | null
  timezone: string | null
  main_location_id: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!jwt) return json({ error: 'Not authenticated.' }, 401)
    const { data: { user } } = await admin().auth.getUser(jwt)
    if (!user) return json({ error: 'Not authenticated.' }, 401)

    const { data: conn } = await admin()
      .from('square_connections').select('*').eq('user_id', user.id).maybeSingle()
    if (!conn) return json({ connected: false }, 200)

    const accessToken = await freshAccessToken(conn as Connection)
    const tz = conn.timezone || 'UTC'

    // Time windows.
    const todayStart = startOfTodayISO(tz)
    const weekStart = new Date(Date.now() - 7 * 86400_000).toISOString()
    const monthStart = new Date(Date.now() - 30 * 86400_000).toISOString()

    // All location ids (orders search needs them explicitly).
    const locationIds = await getLocationIds(accessToken, conn.main_location_id)

    const [today, week, topItems, catalogCount, customers] = await Promise.all([
      sumPayments(accessToken, todayStart),
      sumPayments(accessToken, weekStart),
      topItemsSold(accessToken, locationIds, monthStart),
      countCatalogItems(accessToken),
      countCustomers(accessToken),
    ])

    return json({
      connected: true,
      currency: conn.currency || 'USD',
      timezone: tz,
      revenue: {
        today: today.amount,
        today_count: today.count,
        last_7_days: week.amount,
        last_7_days_count: week.count,
      },
      top_items_last_30_days: topItems,
      catalog_item_count: catalogCount,
      customers,
    }, 200)
  } catch (err) {
    console.error('square-data error:', err)
    return json({ error: (err as Error).message }, 500)
  }
})

// --- token refresh ---------------------------------------------------------

async function freshAccessToken(conn: Connection): Promise<string> {
  const expMs = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0
  // Refresh if it expires within the next 5 minutes (or we don't know).
  if (expMs && expMs - Date.now() > 5 * 60_000) return conn.access_token

  const res = await fetch(`${SQUARE_BASE}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Square-Version': SQUARE_VERSION },
    body: JSON.stringify({
      client_id: APP_ID,
      client_secret: APP_SECRET,
      grant_type: 'refresh_token',
      refresh_token: conn.refresh_token,
    }),
  })
  const token = await res.json()
  if (!res.ok || !token.access_token) {
    console.error('token refresh failed:', token)
    return conn.access_token // fall back; the API call will surface a clear error
  }

  await admin().from('square_connections').update({
    access_token: token.access_token,
    refresh_token: token.refresh_token ?? conn.refresh_token,
    token_expires_at: token.expires_at ?? null,
    updated_at: new Date().toISOString(),
  }).eq('user_id', conn.user_id)

  return token.access_token
}

// --- Square reads ----------------------------------------------------------

function sq(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Square-Version': SQUARE_VERSION,
    'Content-Type': 'application/json',
  }
}

async function getLocationIds(accessToken: string, fallback: string | null): Promise<string[]> {
  try {
    const res = await fetch(`${SQUARE_BASE}/v2/locations`, { headers: sq(accessToken) })
    const ids = ((await res.json())?.locations ?? []).map((l: { id: string }) => l.id)
    if (ids.length) return ids
  } catch (e) {
    console.error('getLocationIds failed:', e)
  }
  return fallback ? [fallback] : []
}

// Sum COMPLETED payments since `beginISO`. Money comes back in the smallest
// currency unit (cents), so we divide by 100 for a human number.
async function sumPayments(accessToken: string, beginISO: string) {
  let total = 0
  let count = 0
  let cursor: string | undefined
  let pages = 0
  do {
    const params = new URLSearchParams({ begin_time: beginISO, sort_order: 'DESC', limit: '100' })
    if (cursor) params.set('cursor', cursor)
    const res = await fetch(`${SQUARE_BASE}/v2/payments?${params}`, { headers: sq(accessToken) })
    const body = await res.json()
    for (const p of body?.payments ?? []) {
      if (p.status === 'COMPLETED' && p.total_money?.amount) {
        total += p.total_money.amount
        count++
      }
    }
    cursor = body?.cursor
    pages++
  } while (cursor && pages < 10) // safety cap
  return { amount: total / 100, count }
}

// Aggregate line items across COMPLETED orders into a top-sellers list.
async function topItemsSold(accessToken: string, locationIds: string[], beginISO: string) {
  if (!locationIds.length) return []
  const tally = new Map<string, number>()
  let cursor: string | undefined
  let pages = 0
  do {
    const res = await fetch(`${SQUARE_BASE}/v2/orders/search`, {
      method: 'POST',
      headers: sq(accessToken),
      body: JSON.stringify({
        location_ids: locationIds,
        limit: 200,
        cursor,
        query: {
          filter: {
            date_time_filter: { created_at: { start_at: beginISO } },
            state_filter: { states: ['COMPLETED'] },
          },
          sort: { sort_field: 'CREATED_AT', sort_order: 'DESC' },
        },
      }),
    })
    const body = await res.json()
    for (const order of body?.orders ?? []) {
      for (const li of order.line_items ?? []) {
        const name = li.name ?? 'Unnamed item'
        tally.set(name, (tally.get(name) ?? 0) + Number(li.quantity ?? 1))
      }
    }
    cursor = body?.cursor
    pages++
  } while (cursor && pages < 5)

  return [...tally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }))
}

async function countCatalogItems(accessToken: string) {
  try {
    let count = 0
    let cursor: string | undefined
    let pages = 0
    do {
      const params = new URLSearchParams({ types: 'ITEM' })
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`${SQUARE_BASE}/v2/catalog/list?${params}`, { headers: sq(accessToken) })
      const body = await res.json()
      count += (body?.objects ?? []).length
      cursor = body?.cursor
      pages++
    } while (cursor && pages < 10)
    return count
  } catch (e) {
    console.error('countCatalogItems failed:', e)
    return 0
  }
}

async function countCustomers(accessToken: string) {
  try {
    let count = 0
    let cursor: string | undefined
    let pages = 0
    do {
      const params = new URLSearchParams({ limit: '100' })
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`${SQUARE_BASE}/v2/customers?${params}`, { headers: sq(accessToken) })
      const body = await res.json()
      count += (body?.customers ?? []).length
      cursor = body?.cursor
      pages++
    } while (cursor && pages < 5)
    return { count, capped: !!cursor }
  } catch (e) {
    console.error('countCustomers failed:', e)
    return { count: 0, capped: false }
  }
}

// --- time -----------------------------------------------------------------

// UTC instant of the most recent midnight in the seller's timezone.
function startOfTodayISO(timeZone: string): string {
  const now = new Date()
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(now).map((p) => [p.type, p.value]),
  )
  const secsSinceMidnight =
    Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second)
  return new Date(now.getTime() - secsSinceMidnight * 1000).toISOString()
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
