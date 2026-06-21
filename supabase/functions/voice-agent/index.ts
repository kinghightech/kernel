// Edge Function: voice-agent
// Backs the dashboard "Enable AI call answering" toggle. JWT-protected.
//
//   POST { action: "enable" }  -> provisions a phone number (if the business
//                                 doesn't have one yet), assigns it to the
//                                 shared Retell agent, turns the agent on, and
//                                 returns the number to display.
//   POST { action: "disable" } -> turns the agent off (keeps the number so it
//                                 stays stable; inbound calls are then rejected
//                                 by voice-webhook).
//
// The shared agent id and Retell key live in Supabase secrets.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const RETELL_KEY = Deno.env.get('RETELL_API_KEY')!
const AGENT_ID = Deno.env.get('RETELL_AGENT_ID')!
const WEBHOOK_URL = `${SUPABASE_URL}/functions/v1/voice-webhook`

const admin = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await userClient.auth.getUser()
    if (!user) return json({ error: 'Not signed in' }, 401)

    const { action } = await req.json()

    if (action === 'disable') {
      await admin.from('voice_agents')
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
      return json({ enabled: false })
    }

    if (action !== 'enable') return json({ error: 'Unknown action' }, 400)

    // Already have a number? Just switch it back on.
    const { data: existing } = await admin
      .from('voice_agents').select('phone_number, phone_number_pretty').eq('user_id', user.id).maybeSingle()

    if (existing?.phone_number) {
      await admin.from('voice_agents')
        .update({ enabled: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
      return json({ enabled: true, phone_number: existing.phone_number, phone_number_pretty: existing.phone_number_pretty })
    }

    // Buy a fresh number assigned to the shared agent.
    const res = await fetch('https://api.retellai.com/create-phone-number', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RETELL_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inbound_agents: [{ agent_id: AGENT_ID, weight: 1.0 }],
        inbound_webhook_url: WEBHOOK_URL,
        nickname: `Kernel — ${user.id.slice(0, 8)}`,
      }),
    })
    const num = await res.json()
    if (!res.ok) {
      console.error('Retell create-phone-number failed', num)
      return json({ error: num?.message ?? 'Could not provision a phone number.' }, 502)
    }

    await admin.from('voice_agents').upsert({
      user_id: user.id,
      enabled: true,
      phone_number: num.phone_number,
      phone_number_pretty: num.phone_number_pretty ?? num.phone_number,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return json({ enabled: true, phone_number: num.phone_number, phone_number_pretty: num.phone_number_pretty ?? num.phone_number })
  } catch (e) {
    console.error(e)
    return json({ error: String(e) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
