// Edge Function: create-checkout
// The browser calls this when a logged-in user clicks "Choose Plan".
// It (1) figures out who the user is, (2) finds or creates their Stripe
// customer, (3) asks Stripe for a hosted checkout page, and (4) hands the
// page's URL back to the browser so it can redirect there.
//
// The Stripe SECRET key lives here, never in the website.

import Stripe from 'https://esm.sh/stripe@18.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})

// The plans we sell. Amounts are in cents ($9.99 -> 999).
// These work in both Test and Live mode with no extra setup.
const PLANS: Record<string, { name: string; monthly: number; yearly: number }> = {
  pro: { name: 'Kernel Pro', monthly: 999, yearly: 9999 },
  max: { name: 'Kernel Max', monthly: 1999, yearly: 19999 },
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Browsers send a preflight OPTIONS request first; answer it.
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { plan, interval } = await req.json()
    const selected = PLANS[plan]
    if (!selected) return json({ error: 'Unknown plan' }, 400)
    const billing = interval === 'year' ? 'year' : 'month'
    const amount = billing === 'year' ? selected.yearly : selected.monthly

    // 1. Who is calling? Read the user from their login token.
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) return json({ error: 'Not logged in' }, 401)

    // 2. Find this user's existing Stripe customer, or create one.
    //    We use the service-role client because it can write to the table.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: existing } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = existing?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
      await admin
        .from('subscriptions')
        .upsert({ user_id: user.id, stripe_customer_id: customerId }, { onConflict: 'user_id' })
    }

    // 3. Ask Stripe for a hosted checkout page for this plan.
    const origin = req.headers.get('origin') ?? Deno.env.get('SITE_URL') ?? ''
    // If a real Stripe Price ID is configured for this plan + interval, use it
    // (e.g. your live Kernel Pro / Kernel Max products). Otherwise define the
    // price inline, which works in both Test and Live with no setup.
    const priceEnvKey = `STRIPE_PRICE_${plan.toUpperCase()}_${billing.toUpperCase()}`
    const configuredPriceId = Deno.env.get(priceEnvKey)
    const lineItem = configuredPriceId
      ? { price: configuredPriceId, quantity: 1 }
      : {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            recurring: { interval: billing },
            product_data: { name: selected.name },
          },
        }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [lineItem],
      // Stamp the user + plan so the webhook knows who paid for what.
      metadata: { user_id: user.id, plan, interval: billing },
      subscription_data: {
        metadata: { user_id: user.id, plan, interval: billing },
        // 3-day free trial on the Pro plan only. Card is collected now;
        // the first charge happens after the trial ends.
        ...(plan === 'pro' ? { trial_period_days: 3 } : {}),
      },
      success_url: `${origin}/checkout?status=success`,
      cancel_url: `${origin}/checkout?status=cancelled`,
    })

    // 4. Hand the page URL back to the browser.
    return json({ url: session.url }, 200)
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
