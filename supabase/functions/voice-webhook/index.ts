// Edge Function: voice-webhook
// The single endpoint Retell calls for the AI call-answering feature. Two jobs:
//
//   1. Inbound call setup (event "call_inbound"): a customer just called a
//      business number that the owner didn't pick up. Retell asks us who owns
//      this number and what the AI should know. We look up the business by the
//      dialed number and hand back its live hours + menu as dynamic variables,
//      so the SAME shared agent can speak as any business with current info.
//
//   2. Call records (events "call_ended" / "call_analyzed"): the call is over.
//      We save the transcript, summary, recording, and any captured lead to the
//      `calls` table so the owner sees it on their dashboard.
//
// No JWT — Retell calls this directly (verify_jwt = false in config.toml).
// Writes use the service role, so they bypass RLS.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-retell-signature, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const DAY_NAMES: Record<string, string> = {
  sun: 'Sunday', mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday',
  thu: 'Thursday', fri: 'Friday', sat: 'Saturday',
}

// "5:00 PM" from "17:00"
function pretty(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function dayHours(hours: Record<string, { open: string; close: string }[]>, key: string): string {
  const slots = hours?.[key]
  if (!slots || slots.length === 0) return 'closed'
  return slots.map((s) => `${pretty(s.open)}–${pretty(s.close)}`).join(', ')
}

// Build the variables the agent's prompt reads from.
type AgentBusiness = {
  hours?: Record<string, { open: string; close: string }[]>
  business_name?: string
  business_type?: string
  address?: string
}
type AgentProduct = { name?: string; price?: string | number; description?: string }
function buildVariables(business: AgentBusiness, products: AgentProduct[]) {
  const hours = (business.hours ?? {}) as Record<string, { open: string; close: string }[]>
  const now = new Date()
  const todayKey = DAYS[now.getDay()]
  const tomorrowKey = DAYS[(now.getDay() + 1) % 7]

  const fullSchedule = DAYS
    .map((k) => `${DAY_NAMES[k]}: ${dayHours(hours, k)}`)
    .join('\n')

  const menu = (products ?? [])
    .map((p) => `- ${p.name}${p.price ? ` (${p.price})` : ''}${p.description ? `: ${p.description}` : ''}`)
    .join('\n') || 'No menu items listed.'

  return {
    business_name: business.business_name ?? 'the business',
    business_type: business.business_type ?? '',
    address: business.address ?? '',
    hours_today: `${DAY_NAMES[todayKey]}: ${dayHours(hours, todayKey)}`,
    hours_tomorrow: `${DAY_NAMES[tomorrowKey]}: ${dayHours(hours, tomorrowKey)}`,
    hours_full: fullSchedule,
    menu,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad JSON' }, 400)
  }

  // --- 1. Inbound call: tell Retell who this business is ---------------------
  // Returning override_agent_id ACCEPTS the call; omitting it REJECTS it.
  if (body.event === 'call_inbound') {
    const inbound = body.call_inbound ?? {}
    const toNumber: string | undefined = inbound.to_number
    const agentId: string | undefined = inbound.agent_id ?? Deno.env.get('RETELL_AGENT_ID')
    if (!toNumber) return json({ call_inbound: {} })

    const { data: agent } = await admin
      .from('voice_agents')
      .select('user_id, enabled')
      .eq('phone_number', toNumber)
      .maybeSingle()

    if (!agent || !agent.enabled) return json({ call_inbound: {} }) // reject

    const [{ data: business }, { data: products }] = await Promise.all([
      admin.from('onboarding').select('*').eq('user_id', agent.user_id).maybeSingle(),
      admin.from('products').select('name, price, description').eq('user_id', agent.user_id),
    ])
    if (!business) return json({ call_inbound: {} }) // reject

    return json({
      call_inbound: {
        override_agent_id: agentId, // required to pick up the call
        dynamic_variables: buildVariables(business, products ?? []),
        metadata: { user_id: agent.user_id },
      },
    })
  }

  // --- 2. Call finished: save the record ------------------------------------
  if (body.event === 'call_ended' || body.event === 'call_analyzed') {
    const call = body.call ?? {}
    // Prefer the user_id we stamped on the call at inbound time; fall back to a
    // lookup by the dialed number in case metadata didn't carry through.
    let userId: string | undefined = call.metadata?.user_id
    if (!userId && call.to_number) {
      const { data: a } = await admin
        .from('voice_agents').select('user_id').eq('phone_number', call.to_number).maybeSingle()
      userId = a?.user_id
    }
    if (!userId) return json({ ok: true }) // not one of ours

    const duration = call.duration_ms != null
      ? Math.round(call.duration_ms / 1000)
      : (call.start_timestamp && call.end_timestamp
        ? Math.round((call.end_timestamp - call.start_timestamp) / 1000)
        : null)

    const row = {
      user_id: userId,
      retell_call_id: call.call_id,
      caller_number: call.from_number ?? null,
      transcript: call.transcript_object ?? null,
      summary: call.call_analysis?.call_summary ?? null,
      recording_url: call.recording_url ?? null,
      duration_seconds: duration,
      lead: call.call_analysis?.custom_analysis_data ?? null,
    }

    // Upsert on retell_call_id: call_ended creates it, call_analyzed enriches it.
    await admin.from('calls').upsert(row, { onConflict: 'retell_call_id' })
    return json({ ok: true })
  }

  return json({ ok: true })
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
