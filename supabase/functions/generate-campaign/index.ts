// Edge Function: generate-campaign
// Takes the user's campaign brief and asks an AI to write a full social media
// campaign, returned as structured JSON. Nothing is saved here — the frontend
// only stores it if the user says they like it.
//
// Uses CAMPAIGN_AI_KEY if set, otherwise falls back to OPENROUTER_API_KEY.
// Model can be overridden with CAMPAIGN_AI_MODEL.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SCHEMA = `{
  "campaignName": string,
  "overview": string,            // 2-3 sentence summary of the campaign idea
  "targetAudience": string,
  "posts": [                     // one object per post
    {
      "platform": string,        // e.g. "Instagram"
      "day": string,             // e.g. "Day 1" or "Monday"
      "caption": string,         // ready-to-post caption
      "hashtags": [string],
      "imageIdea": string        // a short description of the visual
    }
  ],
  "tips": [string]               // 3-5 actionable tips
}`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { inputs } = await req.json()
    const apiKey = Deno.env.get('CAMPAIGN_AI_KEY') ?? Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) return json({ error: 'No AI API key configured.' }, 500)
    const model = Deno.env.get('CAMPAIGN_AI_MODEL') ?? 'openai/gpt-4o-mini'

    const brief = [
      `Product / what they're promoting: ${inputs?.product || 'N/A'}`,
      `Platforms: ${(inputs?.platforms || []).join(', ') || 'any'}`,
      `Goal: ${inputs?.goal || 'awareness'}`,
      `Tone: ${inputs?.tone || 'friendly'}`,
      `Number of posts: ${inputs?.postCount || 5}`,
      `Target audience: ${inputs?.audience || 'general'}`,
      `Extra notes: ${inputs?.extra || 'none'}`,
    ].join('\n')

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              `You are an expert social media marketing strategist. Generate a complete, ready-to-use campaign. ` +
              `Respond with ONLY valid JSON (no markdown, no code fences) matching exactly this shape:\n${SCHEMA}`,
          },
          { role: 'user', content: `Create a social media campaign based on this brief:\n${brief}` },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('AI request failed:', res.status, text)
      return json({ error: `AI request failed (${res.status})` }, 502)
    }

    const data = await res.json()
    const raw: string = data?.choices?.[0]?.message?.content ?? ''

    // Parse defensively in case the model wraps the JSON in code fences.
    let campaign: unknown
    try {
      campaign = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) return json({ error: 'AI returned an unreadable response.' }, 502)
      campaign = JSON.parse(match[0])
    }

    return json({ campaign }, 200)
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
