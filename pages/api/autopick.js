import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Top 10 drivers by general 2026 form — used for random autopick
const TOP_10 = ['Norris', 'Piastri', 'Russell', 'Hamilton', 'Leclerc', 'Sainz', 'Verstappen', 'Antonelli', 'Alonso', 'Hadjar']

function pickRandom3(pool) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return [shuffled[0], shuffled[1], shuffled[2]]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { race_id } = req.body
  if (!race_id) return res.status(400).json({ error: 'race_id required' })

  // Get all players and their picks for this race
  const [{ data: players }, { data: existingPicks }] = await Promise.all([
    supabase.from('players').select('*'),
    supabase.from('picks').select('*').eq('race_id', race_id),
  ])

  const autopicked = []
  const dns = []

  for (const player of players) {
    const hasPick = existingPicks?.find(p => p.player_id === player.id && !p.dns)
    if (hasPick) continue // already picked, skip

    const autopicksUsed = player.autopicks_used || 0

    if (autopicksUsed < 2) {
      // Assign random picks from top 10
      const [p1, p2, p3] = pickRandom3(TOP_10)
      await supabase.from('picks').upsert({
        player_id: player.id,
        race_id,
        p1, p2, p3,
        dns: false,
        is_autopick: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'player_id,race_id' })

      // Increment autopicks_used
      await supabase.from('players').update({
        autopicks_used: autopicksUsed + 1
      }).eq('id', player.id)

      autopicked.push({ name: player.name, p1, p2, p3 })
    } else {
      // Out of autopicks — mark DNS
      await supabase.from('picks').upsert({
        player_id: player.id,
        race_id,
        p1: null, p2: null, p3: null,
        dns: true,
        is_autopick: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'player_id,race_id' })

      dns.push(player.name)
    }
  }

  return res.status(200).json({ autopicked, dns })
}
