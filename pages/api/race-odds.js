import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

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

  // Check cache first unless force refresh
  if (!force) {
    try {
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
    } catch (e) {
      console.warn('Cache read failed:', e.message)
    }
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{
        role: 'user',
        content: `Search for: "2026 F1 ${race_name} Grand Prix betting odds" and "2026 F1 championship standings". 

Use what you find to give accurate win probabilities. Today's date is ${new Date().toDateString()}.
Important: only reference sessions and results that have actually happened. Do not invent practice or qualifying results.

Respond with ONLY this JSON, nothing else, no markdown:
{"summary":"2-3 sentence punchy insight on who to watch and why, grounded in current real-world form and odds","odds":[{"driver":"LastName","probability":0.35},{"driver":"LastName","probability":0.22},{"driver":"LastName","probability":0.15},{"driver":"LastName","probability":0.10},{"driver":"LastName","probability":0.08},{"driver":"LastName","probability":0.06},{"driver":"LastName","probability":0.04}]}

Only use drivers from: Norris, Piastri, Russell, Hamilton, Leclerc, Sainz, Verstappen, Alonso, Stroll, Hulkenberg, Gasly, Doohan, Antonelli, Hadjar, Lawson, Tsunoda, Albon, Colapinto, Bearman, Bortoleto, Magnussen, Ocon, Lindblad.
Probabilities must sum to 1.0. Order by probability descending. Respond with ONLY the JSON object starting with { and ending with }`
      }]
    })

    const textBlock = message.content.find(b => b.type === 'text')
    if (!textBlock) throw new Error('No text in response')

    const raw = textBlock.text.trim()
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('No JSON in response')

    const parsed = JSON.parse(raw.slice(start, end + 1))
    if (!parsed.odds || !parsed.summary) throw new Error('Invalid response structure')

    try {
      await supabase.from('race_odds').upsert({
        race_id,
        odds: parsed.odds,
        summary: parsed.summary,
        updated_at: new Date().toISOString()
      }, { onConflict: 'race_id' })
    } catch (e) {
      console.warn('Cache write failed:', e.message)
    }

    return res.status(200).json({
      odds: parsed.odds,
      summary: parsed.summary,
      cached: false,
      cached_at: new Date().toISOString()
    })

  } catch (err) {
    console.error('Race odds error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
