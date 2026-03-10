import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { race_id } = req.body
  if (!race_id) return res.status(400).json({ error: 'race_id required' })

  // Check if commentary already exists
  const { data: existing } = await supabase
    .from('race_commentary')
    .select('commentary')
    .eq('race_id', race_id)
    .maybeSingle()

  if (existing) return res.status(200).json({ commentary: existing.commentary })

  // Fetch all data
  const [{ data: players }, { data: picks }, { data: results }, { data: allCommentary }] = await Promise.all([
    supabase.from('players').select('*'),
    supabase.from('picks').select('*'),
    supabase.from('race_results').select('*'),
    supabase.from('race_commentary').select('*').order('created_at'),
  ])

  const currentResult = results.find(r => r.race_id === race_id)
  if (!currentResult) return res.status(400).json({ error: 'No result found for race' })

  // Build race history context
  const RACES = [
    { id: 'AUS', name: 'Australia' }, { id: 'CHN', name: 'China' }, { id: 'JPN', name: 'Japan' },
    { id: 'BHR', name: 'Bahrain' }, { id: 'KSA', name: 'Saudi Arabia' }, { id: 'MIA', name: 'Miami' },
    { id: 'CAN', name: 'Canada' }, { id: 'MON', name: 'Monaco' }, { id: 'ESP', name: 'Spain' },
    { id: 'AUT', name: 'Austria' }, { id: 'GBR', name: 'Great Britain' }, { id: 'BEL', name: 'Belgium' },
    { id: 'HUN', name: 'Hungary' }, { id: 'NED', name: 'Netherlands' }, { id: 'ITA', name: 'Italy' },
    { id: 'MAD', name: 'Madrid' }, { id: 'AZE', name: 'Azerbaijan' }, { id: 'SGP', name: 'Singapore' },
    { id: 'USA', name: 'United States' }, { id: 'MEX', name: 'Mexico' }, { id: 'BRA', name: 'Brazil' },
    { id: 'LVS', name: 'Las Vegas' }, { id: 'QAT', name: 'Qatar' }, { id: 'ABD', name: 'Abu Dhabi' },
  ]

  function calcScore(pick, result) {
    if (!pick || pick.dns || !result) return 0
    const actual = [result.p1, result.p2, result.p3]
    const s1 = pick.p1 === result.p1 ? 4 : actual.includes(pick.p1) ? 1 : 0
    const s2 = pick.p2 === result.p2 ? 3 : actual.includes(pick.p2) ? 1 : 0
    const s3 = pick.p3 === result.p3 ? 2 : actual.includes(pick.p3) ? 1 : 0
    let bonus = 0
    if (pick.p1 === result.p1 && pick.p2 === result.p2 && pick.p3 === result.p3) bonus = 5
    else if ([pick.p1, pick.p2, pick.p3].sort().join() === [...actual].sort().join()) bonus = 3
    return s1 + s2 + s3 + bonus
  }

  // Build season standings
  const standings = players.map(p => {
    const total = results.reduce((sum, r) => {
      const pk = picks.find(pk => pk.player_id === p.id && pk.race_id === r.race_id)
      return sum + calcScore(pk, r)
    }, 0)
    return { name: p.name, total }
  }).sort((a, b) => b.total - a.total)

  // Build previous commentary snippets for context
  const prevCommentary = allCommentary
    .filter(c => c.race_id !== race_id)
    .map(c => {
      const race = RACES.find(r => r.id === c.race_id)
      return `--- ${race?.name || c.race_id} ---\n${c.commentary}`
    }).join('\n\n')

  // Build current race picks summary
  const currentRaceName = RACES.find(r => r.id === race_id)?.name || race_id
  const picksSummary = players.map(p => {
    const pk = picks.find(pk => pk.player_id === p.id && pk.race_id === race_id)
    const score = calcScore(pk, currentResult)
    if (!pk) return `${p.name}: no pick — 0 pts`
    if (pk.dns) return `${p.name}: DNS — 0 pts`
    return `${p.name}: picked ${pk.p1}/${pk.p2}/${pk.p3} — ${score} pts`
  }).join('\n')

  const prompt = `You are "Robo Brundle" — a sharply snarky, slightly PG-13, cutting AI version of Martin Brundle doing a post-race grid walk of a fantasy F1 pick'em pool. You know all the players personally and roast them mercilessly but with affection. You reference past races and patterns. You're disappointed by bad picks, gleeful at disasters, and backhanded with compliments.

RACE: ${currentRaceName}
ACTUAL PODIUM: P1 ${currentResult.p1}, P2 ${currentResult.p2}, P3 ${currentResult.p3}

PICKS & SCORES THIS RACE:
${picksSummary}

CURRENT SEASON STANDINGS:
${standings.map((p, i) => `${i + 1}. ${p.name} — ${p.total} pts`).join('\n')}

${prevCommentary ? `YOUR PREVIOUS COMMENTARY THIS SEASON (maintain continuity, reference past performances):
${prevCommentary}` : ''}

Write a Brundle-style post-race commentary of 150-200 words. Go player by player. Be specific about their picks. Reference season context and past patterns where relevant. End with a one-liner overall verdict on the race. No headers, just flowing prose with personality.`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  })

  const commentary = message.content[0].text

  // Cache it
  await supabase.from('race_commentary').insert({ race_id, commentary })

  return res.status(200).json({ commentary })
}
