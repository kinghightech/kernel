// Edge Function: generate-website
// Builds (or edits) a real, multi-FILE marketing website and returns the files.
//
// Modes:
//   * build: given `inputs`, generate a fresh multi-file site.
//   * edit:  given `currentFiles` + `instruction`, return the updated file set.
// Returns { files } (filename -> contents). The app renders these directly in an
// iframe and lets the user download them — Supabase Storage refuses to serve user
// HTML as renderable text/html, so we deliberately do NOT host here.
//
// Uses WEBSITE_AI_KEY / CAMPAIGN_AI_KEY / OPENROUTER_API_KEY for OpenRouter.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Product {
  name: string
  price?: string
  description?: string
  image_url?: string
}

interface WebsiteInputs {
  businessName?: string
  businessType?: string
  about?: string
  address?: string
  phone?: string
  email?: string
  hours?: string
  discounts?: string
  tone?: string
  accentColor?: string
  backgroundColor?: string
  logoUrl?: string
  extra?: string
  products?: Product[]
}

const DESIGN_RULES = `You are the design lead at a small studio known for giving every client a visual identity that could not be mistaken for anyone else's. This client has rejected templated, generic websites. Design a distinctive, premium, multi-PAGE marketing site that is SPECIFIC to this exact business — deliberate, opinionated choices in palette, type, and layout. It must look custom and intentional, never AI-generated.

OUTPUT FORMAT — MULTIPLE FILES
- Build four pages: index.html (Home), menu.html (Menu/Catalog), about.html (About), contact.html (Contact).
- Output EACH file using this EXACT delimiter on its own line immediately before its contents:
<<<FILE index.html>>>
...full HTML document...
<<<FILE menu.html>>>
...full HTML document...
<<<FILE about.html>>>
...
<<<FILE contact.html>>>
...
- Each file is a COMPLETE, standalone HTML5 document (<!DOCTYPE html> … </html>) with <meta charset="UTF-8"> in the head.
- Do NOT use markdown or code fences. Output ONLY the delimiters and raw HTML. No commentary.

TECH FOR EACH PAGE
- Tailwind CSS via <script src="https://cdn.tailwindcss.com"></script> in <head>, then a <script> setting tailwind.config with your chosen Google Font as the default font and a small named color palette (derived from the business + the user's accent/background).
- Load Google Fonts you deliberately chose for this brand (see Typography below).
- Same sticky header + footer across all four pages for cohesion. Header nav links to the other pages with BARE RELATIVE links only: <a href="index.html">…</a>, "menu.html", "about.html", "contact.html". Highlight the current page. NEVER use absolute URLs, external domains, http(s) links, ".html" with paths, or target attributes for internal nav.
- Responsive (md:/lg:). Logo: a normal <img>. Missing product image: a tasteful muted placeholder <div> with the product's initial, never a broken image.

HOW TO MAKE IT GENUINELY GOOD (not generic)
- Ground every choice in THIS business — its world, products, audience, and vibe. The site should feel made for this specific business, not any business.
- The hero is a thesis: open with the most characteristic thing about this business — a bold, specific statement or striking layout or the signature product. Do NOT do the template hero (a centered "Welcome to [Name]" headline + subheadline + two buttons on a plain/gradient background).
- Typography carries the personality: deliberately pair a CHARACTERFUL display face with a clean body face from Google Fonts that fit this business (e.g. a warm rounded sans for a cozy cafe, a refined serif for a boutique, a bold grotesk for something modern). Set a real type scale — big confident display sizes (text-5xl→text-7xl), restrained body. Make the type itself memorable.
- Commit to a cohesive palette of 4–6 colors and follow the 60-30-10 rule: 60% a clean NEUTRAL canvas (use the BACKGROUND color; if it is saturated, use a light or dark TINT of it — never flood the page with saturation); 30% subtle secondary tones for alternating sections/cards/borders; 10% the ACCENT color used sparingly for CTAs, active links, key highlights, the promo badge.
- Give the site ONE signature element it is remembered by (a distinctive section layout, a bold type treatment, a motif drawn from the business's world). Spend your boldness there; keep everything else quiet and disciplined.
- Generous, consistent spacing (py-20 to py-28 sections, gap-10/12, centered max-w-6xl). Tasteful micro-interactions only (hover:-translate-y-1, hover:shadow-xl, transition). Over-animating reads as AI-generated.

DO NOT use these AI-generated clichés unless the brief explicitly asks for them:
- Cream (#F4F1EA-ish) background + high-contrast serif + terracotta accent.
- Near-black background with a single acid-green or vermilion accent.
- Broadsheet/newspaper hairline-rule layout with zero border-radius.
- The generic centered "Welcome to [Business]" hero.
- Decorative 01/02/03 numbered markers when the content is not actually a sequence.

COPY (it is design material — write it well)
- Write specific, real copy for THIS business: concrete, plain, active voice, from the visitor's point of view. Headlines that say something true and particular. Product blurbs that make the actual item sound good.
- NEVER use lorem ipsum or filler like "Welcome to our business", "Our mission is to provide quality", or "We value our customers."

PAGE CONTENT
- index.html (Home): header; a distinctive hero (per above); a section that conveys what makes this business special; a featured-products strip; the promo/discount featured cleanly; a closing CTA; footer.
- menu.html (Menu/Catalog): header; the FULL catalog as a polished responsive grid — EVERY product with its exact image, name, price (accent), and description; footer.
- about.html (About): header; the business's real story in a couple of substantial, specific paragraphs; a supporting visual or stat row; footer.
- contact.html (Contact): header; a well-designed contact block with the address, hours, phone, and email, and a warm invitation to visit; footer.

USE THE REAL BUSINESS DATA (critical)
- Use the real business name, type, about/story, address, hours, phone, email, discounts, and the exact product list everywhere. Show EVERY product with its exact provided image URL, name, price, and description.
- Only use contact details that were provided; omit anything missing gracefully. Never invent phone numbers, emails, addresses, or social links.

QUALITY FLOOR
- Responsive down to mobile; visible keyboard focus states; respect prefers-reduced-motion.

NO PAYMENTS OR BOOKING
- No online payments or bookings. Don't build or fake checkout/cart/booking forms. "Order/Buy/Book" buttons invite visitors to come in (use the address) or call/email, or link to contact.html.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { inputs, currentFiles, instruction } = (await req.json()) as {
      inputs?: WebsiteInputs
      currentFiles?: Record<string, string>
      instruction?: string
    }

    const apiKey =
      Deno.env.get('WEBSITE_AI_KEY') ??
      Deno.env.get('CAMPAIGN_AI_KEY') ??
      Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) return json({ error: 'No AI API key configured.' }, 500)
    const requestedModel = Deno.env.get('WEBSITE_AI_MODEL') ?? 'google/gemini-2.5-flash'
    const FALLBACK_MODEL = 'openai/gpt-4.1-mini'

    const brief = buildBrief(inputs ?? {})
    const isEdit = currentFiles && Object.keys(currentFiles).length > 0 && !!instruction

    const userContent = isEdit
      ? `Business context (for reference):\n${brief}\n\n` +
        `The user wants this change:\n"${instruction}"\n\n` +
        `Here are the CURRENT files. Apply the change and return ALL FOUR files again in full, ` +
        `using the exact <<<FILE filename>>> format, keeping everything else intact and the nav working.\n\n` +
        serializeFiles(currentFiles!)
      : `Build the website for this business:\n\n${brief}`

    const mkBody = (m: string) => JSON.stringify({
      model: m,
      max_tokens: 20000,
      provider: { sort: 'throughput' },
      messages: [
        { role: 'system', content: DESIGN_RULES },
        { role: 'user', content: userContent },
      ],
    })

    // Try the requested model; if its slug is unrecognized (400/404), fall back
    // to a known-good Claude slug so a model-name change can't break generation.
    const modelsToTry = requestedModel === FALLBACK_MODEL ? [requestedModel] : [requestedModel, FALLBACK_MODEL]
    let model = requestedModel
    let res!: Response
    let data: { error?: { code?: number | string; message?: string }; choices?: Array<{ message?: { content?: string } }> } | null = null

    outer:
    for (const m of modelsToTry) {
      model = m
      const body = mkBody(m)
      const MAX_ATTEMPTS = 4
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://kernel.app',
            'X-Title': 'Kernel Website Builder',
          },
          body,
        })
        data = await res.json().catch(() => null)
        const errCode = res.status || data?.error?.code
        const ok = res.ok && data && !data?.error
        if (ok) break outer
        // Unrecognized model -> try the next model immediately.
        if (errCode === 400 || errCode === 404) {
          console.warn(`Model ${m} rejected (${errCode}); trying fallback…`)
          break
        }
        const retryable = errCode === 429 || errCode === 502 || errCode === 503
        if (!retryable || attempt === MAX_ATTEMPTS) break outer
        console.warn(`AI attempt ${attempt} for ${m} got ${res.status}; retrying…`)
        await new Promise((r) => setTimeout(r, attempt * 2500))
      }
    }

    if (!res.ok || !data) {
      const detail = data?.error?.message ?? (typeof data === 'object' ? JSON.stringify(data) : `HTTP ${res.status}`)
      console.error('AI request failed:', res.status, detail)
      const hint = res.status === 429
        ? `The model (${model}) is rate-limited right now. Wait a moment and try again.`
        : `${String(detail).slice(0, 300)}`
      return json({ error: `AI request failed (${res.status}): ${hint}` }, 200)
    }
    if (data?.error) {
      return json({ error: `AI error: ${String(data.error.message ?? JSON.stringify(data.error)).slice(0, 400)}` }, 200)
    }

    const raw: string = data?.choices?.[0]?.message?.content ?? ''
    const files = parseFiles(raw)
    if (!files['index.html']) {
      console.error('No index.html parsed. Raw head:', raw.slice(0, 400))
      return json({ error: 'The model did not return a usable website. Please try again.' }, 200)
    }

    // Return the files for the app to render directly (Supabase Storage refuses
    // to serve user HTML as renderable text/html, so we do NOT host here — the
    // app previews the files in-browser and the user downloads them to go live).
    return json({ files }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: (err as Error).message }, 500)
  }
})

function serializeFiles(files: Record<string, string>): string {
  return Object.entries(files).map(([n, c]) => `<<<FILE ${n}>>>\n${c}`).join('\n')
}

// Parse the model's multi-file reply into { filename: content }.
function parseFiles(raw: string): Record<string, string> {
  const files: Record<string, string> = {}
  const parts = raw.split(/<<<FILE\s+([^\n>]+?)\s*>>>/g)
  if (parts.length < 3) {
    // No delimiters — treat the whole thing as a single index.html if it looks like HTML.
    const doc = raw.match(/<!DOCTYPE[\s\S]*<\/html>/i) || raw.match(/<html[\s\S]*<\/html>/i)
    if (doc) files['index.html'] = doc[0]
    return files
  }
  for (let i = 1; i < parts.length; i += 2) {
    const name = parts[i].trim()
    let content = (parts[i + 1] ?? '').trim()
    content = content.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
    if (name && content) files[name] = content
  }
  return files
}

function buildBrief(inputs: WebsiteInputs): string {
  const products = (inputs?.products ?? []).filter((p) => p && p.name)
  const catalog = products.length > 0
    ? products.map((p, i) => {
        const parts = [`  ${i + 1}. ${p.name}`]
        if (p.price) parts.push(`price: ${p.price}`)
        if (p.description) parts.push(`description: ${p.description}`)
        if (p.image_url) parts.push(`image URL: ${p.image_url}`)
        return parts.join(' | ')
      }).join('\n')
    : '  (no products provided — keep the catalog page minimal)'

  return [
    `Business name: ${inputs?.businessName || 'N/A'}`,
    `Type of business: ${inputs?.businessType || 'N/A'}`,
    `About / description: ${inputs?.about || 'N/A'}`,
    `Address: ${inputs?.address || 'N/A'}`,
    `Phone: ${inputs?.phone || 'N/A'}`,
    `Email: ${inputs?.email || 'N/A'}`,
    `Hours: ${inputs?.hours || 'N/A'}`,
    `Current discounts / promotions: ${inputs?.discounts || 'none'}`,
    `Desired tone / vibe: ${inputs?.tone || 'clean and modern'}`,
    `Accent color (the 10% — CTAs, links, highlights): ${inputs?.accentColor || 'choose one that fits'}`,
    `Background / canvas color (the 60% dominant neutral): ${inputs?.backgroundColor || 'a clean neutral'}`,
    `Logo image URL: ${inputs?.logoUrl || '(none — use the business name as a wordmark)'}`,
    `Extra notes: ${inputs?.extra || 'none'}`,
    `Products / catalog:\n${catalog}`,
  ].join('\n')
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
