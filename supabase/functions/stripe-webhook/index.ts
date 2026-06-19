// Edge Function: stripe-webhook
// Stripe calls THIS (not the browser) after something happens to a payment or
// subscription. It is the source of truth for "who has paid". We verify the
// message is genuinely from Stripe (signature check), then update our table.
//
// This function must be deployed with JWT verification turned OFF, because
// Stripe does not (and cannot) send a Supabase login token.

import Stripe from 'https://esm.sh/stripe@18.5.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  httpClient: Stripe.createFetchHttpClient(),
})
// Deno needs the async crypto provider for signature verification.
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  // Prove the message really came from Stripe and wasn't faked.
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    console.error('Signature verification failed:', (err as Error).message)
    return new Response('Bad signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          await saveSubscription(sub, session.metadata?.user_id, session.metadata?.plan)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await saveSubscription(sub, sub.metadata?.user_id, sub.metadata?.plan)
        break
      }
    }
  } catch (err) {
    console.error('Handler error:', (err as Error).message)
    return new Response('Handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

// Write the latest subscription state into our table.
async function saveSubscription(
  sub: Stripe.Subscription,
  userId: string | undefined,
  plan: string | undefined,
) {
  // Period end lives at the top level on older API versions and on the line
  // item on newer ones; read whichever is present.
  const periodEnd =
    (sub as { current_period_end?: number }).current_period_end ??
    sub.items?.data?.[0]?.current_period_end ??
    null

  const row: Record<string, unknown> = {
    stripe_customer_id: sub.customer as string,
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }
  if (plan) row.plan = plan

  if (userId) {
    // Normal case: we know the user, so match (and create) by user_id.
    row.user_id = userId
    await admin.from('subscriptions').upsert(row, { onConflict: 'user_id' })
  } else {
    // Fallback (e.g. an event without our metadata): match by customer.
    await admin.from('subscriptions').update(row).eq('stripe_customer_id', sub.customer as string)
  }
}
