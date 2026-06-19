// Edge Function: generate-image
// Generates a real image from a text prompt using an OpenRouter image model
// (default: black-forest-labs/flux.2-klein-4b) and returns it as a data URL.
//
// Uses CAMPAIGN_AI_KEY if set, otherwise OPENROUTER_API_KEY.
// Model can be overridden with CAMPAIGN_IMAGE_MODEL.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { prompt } = await req.json()
    if (!prompt || typeof prompt !== 'string') return json({ error: 'A prompt is required.' }, 400)

    const apiKey = Deno.env.get('CAMPAIGN_AI_KEY') ?? Deno.env.get('OPENROUTER_API_KEY')
    if (!apiKey) return json({ error: 'No AI API key configured.' }, 200)
    const model = Deno.env.get('CAMPAIGN_IMAGE_MODEL') ?? 'black-forest-labs/flux.2-klein-4b'

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        // Ask OpenRouter to return an image
        modalities: ['image'],
        messages: [
          { role: 'user', content: `Generate a high-quality social media marketing image: ${prompt}` },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Image request failed:', res.status, text)
      return json({ error: `Image request failed (${res.status}): ${text}` }, 200)
    }

    const data = await res.json()
    // OpenRouter returns generated images on the assistant message.
    let url: string | undefined = data?.choices?.[0]?.message?.images?.[0]?.url ?? data?.choices?.[0]?.message?.images?.[0]?.image_url?.url
    
    if (!url) {
      // Fallback in case OpenRouter returned it in the content as a URL or markdown.
      const content = data?.choices?.[0]?.message?.content
      if (content && content.startsWith('http')) {
         url = content.trim()
      } else if (content) {
         // match markdown image: ![alt](url)
         const match = content.match(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/)
         if (match) url = match[1]
      }
    }

    if (!url) {
      console.error('No image in response:', JSON.stringify(data).slice(0, 500))
      return json({ error: 'The model did not return an image. Data: ' + JSON.stringify(data).slice(0, 200) }, 200)
    }

    return json({ image: url }, 200)
  } catch (err) {
    console.error(err)
    return json({ error: (err as Error).message }, 200)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
