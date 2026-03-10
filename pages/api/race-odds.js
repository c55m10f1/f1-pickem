import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

// Extend Vercel function timeout to 60 seconds
export const config = { maxDuration: 60 }

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CACHE_HOURS = 4

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { race_id, race_name, force } = req.body
  if (!race_id || !race_name) return res.status(400).json({ error: 'race_id and race_name required' })

  // Check cache unless force refresh requested
  if (!force) {
    const { data: cached } = await supabase
      .from('race_odds')
      .select('*')
      .eq('race_id', race_id)
      .maybeSingle()

    if (cached) {
      const age = (Date.now() - new Date(cached.updated_at).getTime()) / (1000 * 60 * 60)
      if (age < CACHE_HOURS) {
        return res.status(200).json({
          odds: cached.odds,
          summary: cached.summary,
          cached: true,
          cached_at: cached.updated_at
        })
      }
    }
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for current 2026 F1 ${race_name} race winner odds and recent qualifying/practice results. 

Then respond with ONLY a JSON object in this exact format, no other text:
{
  "summary": "2-3 sentence punchy insight about who to watch and why, based on current form and odds. Be specific about drivers and reasons.",
  "odds": [
    { "driver": "LastName", "probability": 0.35 },
    { "driver": "LastName", "probability": 0.22 },
    { "driver": "LastName", "probability": 0.15 },
    { "driver": "LastName", "probability": 0.10 },
    { "driver": "LastName", "probability": 0.08 },
    { "driver": "LastName", "probability": 0.06 },
    { "driver": "LastName", "probability": 0.04 }
  ]
}

Only include drivers from this list: Norris, Piastri, Russell, Hamilton, Leclerc, Sainz, Verstappen, Alonso, Stroll, Hulkenberg, Gasly, Doohan, Antonelli, Hadjar, Lawson, Tsunoda, Albon, Colapinto, Bearman, Bortoleto, Magnussen, Ocon, Lindblad.
Probabilities must sum to 1.0. Order by probability descending. Return ONLY the JSON, nothing else.`
      }]
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock) throw new Error('No text response from Claude')

    const clean = textBlock.text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Upsert into cache with current timestamp
    await supabase.from('race_odds').upsert({
      race_id,
      odds: parsed.odds,
      summary: parsed.summary,
      updated_at: new Date().toISOString()
    }, { onConflict: 'race_id' })

    return res.status(200).json({
      odds: parsed.odds,
      summary: parsed.summary,
      cached: false
    })
  } catch (err) {
    console.error('Race odds error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
