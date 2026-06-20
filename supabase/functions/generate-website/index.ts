// Edge Function: generate-website
// Builds (or edits) a real, multi-FILE marketing website and HOSTS it on Supabase
// Storage so it is genuinely live (multi-page nav, CSS, images all work for real).
//
// Modes:
//   * build: given `inputs`, generate a fresh multi-file site.
//   * edit:  given `currentFiles` + `instruction`, return the updated file set.
// In both cases the files are uploaded to business-assets/<userId>/site/ and the
// function returns { files, url } where url is the live index.html.
//
// Uses WEBSITE_AI_KEY / CAMPAIGN_AI_KEY / OPENROUTER_API_KEY for OpenRouter, and the
// auto-injected SUPABASE_SERVICE_ROLE_KEY to host the files.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const BUCKET = 'business-assets'

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

const DESIGN_RULES = `You are an expert UX designer and senior front-end engineer. You generate complete, production-ready, genuinely beautiful marketing websites — premium, custom-coded sites that look like a top studio shipped them. NEVER cheap, generic, or "vibe-coded".

OUTPUT FORMAT — MULTIPLE FILES
- Build a real multi-PAGE website made of these four pages: index.html (Home), menu.html (Menu/Catalog), about.html (About), contact.html (Contact).
- Output EACH file using this EXACT delimiter on its own line immediately before the file's contents:
<<<FILE index.html>>>
...the full HTML document...
<<<FILE menu.html>>>
...the full HTML document...
<<<FILE about.html>>>
...
<<<FILE contact.html>>>
...
- Each file is a COMPLETE, standalone HTML5 document (starts with <!DOCTYPE html>, ends with </html>).
- Do NOT use markdown or code fences. Output ONLY the delimiters and raw HTML. No commentary.

EACH PAGE
- Uses Tailwind CSS via <script src="https://cdn.tailwindcss.com"></script> in the <head>, then a <script> that sets tailwind.config with the chosen Google Font as the default font and the accent + background colors as theme colors.
- Loads premium Google Fonts matching the requested vibe (e.g. 'Inter'/'Outfit' modern, 'Playfair Display'+'Inter' elegant, 'Sora'/'Space Grotesk' bold).
- Shares the SAME sticky header and footer across all four pages so it feels like one cohesive site.
- The header nav links to the OTHER pages with RELATIVE links: <a href="index.html">Home</a>, <a href="menu.html">Menu</a>, <a href="about.html">About</a>, <a href="contact.html">Contact</a>. Highlight the current page's link with the accent. NEVER use absolute URLs, external domains, http(s) links, or target attributes for internal nav — ONLY the bare relative filenames above.
- Fully responsive (Tailwind md:/lg:). Logo: a normal <img>. Missing product images: a tasteful muted placeholder <div>, never a broken image.

DESIGN PRINCIPLES (non-negotiable)
- Refined, high-end, custom feel. Avoid template clichés, default cobalt blue, harsh borders, clip-art energy.
- Editorial typography: massive high-contrast display headlines (text-5xl–text-7xl, font-bold, tight tracking), restrained legible body, clear scale.
- Spacing — density without clutter: py-20 to py-28 sections, gap-10/12, centered max-w-6xl containers.
- THE 60-30-10 COLOR RULE (STRICT): 60% = a clean NEUTRAL canvas using the BACKGROUND color (if it is saturated, use a light/dark tint of it — never flood the page). 30% = subtle muted tones for alternating sections, cards, borders. 10% = the ACCENT color used sparingly for CTAs, active links, key highlights, the promo badge.
- Micro-interactions: hover:shadow-xl, hover:-translate-y-1, transition-all duration-300 on cards/buttons. Tasteful.

PAGE CONTENT
- index.html (Home): sticky header; a striking hero (massive headline, the About text as a subheadline, the promo shown with the accent, 1–2 CTA buttons); a highlights/"why us" band (3–4 columns); a featured-products strip; a closing call-to-action band; footer.
- menu.html (Menu/Catalog): header; a section title; the FULL catalog as a responsive grid showing EVERY product with its exact image, name, price (accent color), and description; cards with hover lift; footer.
- about.html (About): header; the business's real story in a couple of substantial paragraphs; a stat row or image; a short testimonials / "loved by locals" section; footer.
- contact.html (Contact): header; a structured contact block with the address, hours, phone, and email; a warm "Visit us" message; footer.

USE THE REAL BUSINESS DATA (critical)
- Use the real business name, type, about/story, address, hours, phone, email, discounts, and the exact product list. Write specific, persuasive copy for THIS business — real headlines and product blurbs. NEVER lorem ipsum or generic filler.
- Show EVERY product with its exact provided image URL, name, price, and description. Feature any discount/promo prominently.
- Only use contact details that were provided; omit anything missing gracefully. Never invent phone numbers, emails, addresses, or social links.

NO PAYMENTS OR BOOKING
- No online payments or bookings. Don't build or fake checkout/cart/booking forms. "Order/Buy/Book" buttons should invite visitors to come in (use the address) or call/email, or link to contact.html.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { inputs, currentFiles, instruction } = (await req.json()) as {
      inputs?: WebsiteInputs
      currentFiles?: Record<string, string>
      instruction?: string
    }

    // Identify the caller so we host under their own folder.
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    const supaUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supaUrl, serviceKey, { auth: { persistSession: false } })
    const { data: { user }, error: userErr } = await admin.auth.getUser(jwt)
    if (userErr || !user) return json({ error: 'Not authenticated.' }, 401)

    const apiKey =
      Deno.env.get('WEBSITE_AI_KEY') ??
      Deno.env.get('CAMPAIGN_AI_KEY') ??
      Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) return json({ error: 'No AI API key configured.' }, 500)
    const requestedModel = Deno.env.get('WEBSITE_AI_MODEL') ?? 'anthropic/claude-sonnet-4.6'
    const FALLBACK_MODEL = 'anthropic/claude-sonnet-4.5'

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
      max_tokens: 32000,
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
    let data: any = null

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

    // Host the files under the user's private folder. Same path each time = the
    // site updates in place (one active site per user).
    const base = `${user.id}/site`
    for (const [name, content] of Object.entries(files)) {
      const type = contentTypeFor(name)
      // Use a typed Blob so Storage serves the file with the right Content-Type
      // (raw byte uploads were defaulting to text/plain, so HTML showed as code).
      const blob = new Blob([content], { type })
      const { error: upErr } = await admin.storage.from(BUCKET).upload(`${base}/${name}`, blob, {
        contentType: type,
        upsert: true,
      })
      if (upErr) {
        console.error('host upload failed for', name, upErr)
        return json({ error: `Could not host the site (${name}): ${upErr.message}` }, 200)
      }
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(`${base}/index.html`)
    return json({ files, url: publicUrl }, 200)
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

function contentTypeFor(name: string): string {
  if (name.endsWith('.html')) return 'text/html; charset=utf-8'
  if (name.endsWith('.css')) return 'text/css; charset=utf-8'
  if (name.endsWith('.js')) return 'application/javascript; charset=utf-8'
  return 'text/plain; charset=utf-8'
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
