# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite, port 5173)
npm run build      # Type-check + production build
npm run lint       # ESLint
```

Supabase (requires Supabase CLI):
```bash
supabase start                              # Start local Supabase stack
supabase functions serve <name>            # Serve a single edge function locally
supabase db push                           # Push migrations to remote
supabase migration new <name>              # Create a new migration file
```

## Architecture

**Kernel** is a React 19 + TypeScript + Vite SPA. There is no Next.js — routing is client-side via React Router DOM v7. The backend is entirely Supabase (auth, Postgres, edge functions, storage) plus Stripe for billing.

### Routing (`src/App.tsx`)

```
/              → Landing page
/auth          → Sign in / sign up (email + Google OAuth)
/auth/callback → OAuth callback handler
/onboarding    → Multi-step business onboarding
/checkout      → Stripe checkout return
/success       → Post-signup success
/dashboard     → DashboardLayout (auth-gated)
  index        → Home
  /ai          → AI Chat
  /marketing   → Campaign generator
  /website     → Website builder
  /settings    → Account settings
```

### Dashboard access gate (`src/pages/DashboardLayout.tsx`)

Three sequential checks before rendering the dashboard:
1. User must be signed in → else redirect `/auth`
2. User must have completed onboarding → else redirect `/onboarding`
3. User must have an active/trialing subscription → else render `<PayWall />`

After a successful Stripe checkout, the layout polls `useSubscription()` every 2 s (up to 8 tries) waiting for the webhook to activate the subscription.

### Service modules (`src/`)

| File | Responsibility |
|---|---|
| `supabase.ts` | Supabase client + exports `supabaseUrl` and `supabaseAnonKey` |
| `billing.ts` | `startCheckout()`, `openBillingPortal()`, `useSubscription()` hook |
| `onboarding.ts` | Save/load onboarding data; stages answers in localStorage before sign-up, flushes on sign-in via `flushPendingOnboarding()` |
| `campaigns.ts` | Generate/save/load/delete marketing campaigns; image generation via edge functions |
| `website.ts` | Business profile, product catalog, AI website generation/editing, asset uploads |
| `theme.ts` | Light/dark theme; applied in DashboardLayout after the subscription check passes |

### Supabase edge functions (`supabase/functions/`)

| Function | JWT required | Purpose |
|---|---|---|
| `create-checkout` | yes | Create Stripe checkout session |
| `create-portal` | yes | Open Stripe billing portal |
| `generate-campaign` | yes | AI-generate marketing campaign |
| `generate-image` | yes | AI-generate image from prompt |
| `generate-website` | yes | AI-generate or edit multi-file website HTML/CSS/JS |
| `upload-asset` | yes (manual) | Upload logo/product images to `business-assets` storage bucket |
| `stripe-webhook` | no | Handle Stripe events (subscription lifecycle) |
| `square-oauth` | no | Square OAuth (`/start`, `/callback`, `/status`, `/disconnect` by path; checks JWT by hand except `/callback`) |
| `square-data` | no (manual) | Read connected Square account: revenue, top items, catalog/customer counts; auto-refreshes the access token |

Square env: `SQUARE_ENV` (`sandbox`\|`production`), `SQUARE_APP_ID`, `SQUARE_APP_SECRET` are Supabase secrets. Switching to production = change those three; no code changes. The OAuth redirect URL registered in the Square dashboard must be `<SUPABASE_URL>/functions/v1/square-oauth/callback`.

### Storage uploads

Direct browser → Supabase Storage uploads fail due to storage RLS. All file uploads must go through the `upload-asset` edge function (`src/website.ts:uploadAsset`). The function requires the user's access token sent explicitly as `Authorization: Bearer <token>` — the Supabase client does not attach it automatically for raw `fetch()` calls.

### Database tables

- `subscriptions` — Stripe subscription state per user (`status`, `plan`, `current_period_end`)
- `onboarding` — business profile + theme; one row per user; includes `logo_url`
- `campaigns` — saved marketing campaigns (JSONB `inputs`, `content`, `images`)
- `websites` — one active site per user (JSONB `files`, `inputs`; `html` convenience column)
- `products` — product catalog per user
- `square_connections` — Square OAuth tokens + business metadata per user (RLS on, no policies: server-only)
- `square_oauth_states` — short-lived CSRF tokens tying an OAuth callback to the user who started it (server-only)

### Styling

Tailwind CSS v3 with a dark-first design (`#0c0c0c` background). The brand accent is `#00d2ff` / `#A4F4FD`. A `.liquid-glass` utility class is used for frosted-glass card surfaces. Animations use Motion (`motion/react`).
