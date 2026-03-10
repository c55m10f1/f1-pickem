// Proxy for Polymarket Gamma API — avoids CORS issues on client
// Maps our race IDs to Polymarket slug search terms
const RACE_SLUGS = {
  AUS: 'australian grand prix',
  CHN: 'chinese grand prix',
  JPN: 'japanese grand prix',
  BHR: 'bahrain grand prix',
  KSA: 'saudi arabian grand prix',
  MIA: 'miami grand prix',
  CAN: 'canadian grand prix',
  MON: 'monaco grand prix',
  ESP: 'spanish grand prix',
  AUT: 'austrian grand prix',
  GBR: 'british grand prix',
  BEL: 'belgian grand prix',
  HUN: 'hungarian grand prix',
  NED: 'dutch grand prix',
  ITA: 'italian grand prix',
  MAD: 'madrid grand prix',
  AZE: 'azerbaijan grand prix',
  SGP: 'singapore grand prix',
  USA: 'united states grand prix',
  MEX: 'mexico grand prix',
  BRA: 'brazilian grand prix',
  LVS: 'las vegas grand prix',
  QAT: 'qatar grand prix',
  ABD: 'abu dhabi grand prix',
}

export default async function handler(req, res) {
  const { race_id } = req.query
  if (!race_id) return res.status(400).json({ error: 'race_id required' })

  const searchTerm = RACE_SLUGS[race_id]
  if (!searchTerm) return res.status(400).json({ error: 'Unknown race_id' })

  try {
    // Search for the race winner event
    const url = `https://gamma-api.polymarket.com/events?active=true&closed=false&limit=20&order=volume&ascending=false`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Polymarket API error: ${response.status}`)
    const events = await response.json()

    // Find the race winner market for this race
    const raceEvent = events.find(e => {
      const title = (e.title || '').toLowerCase()
      return title.includes(searchTerm.split(' ')[0]) &&
             title.includes(searchTerm.split(' ').slice(-2).join(' ')) &&
             (title.includes('winner') || title.includes('driver'))
    }) || events.find(e => {
      const title = (e.title || '').toLowerCase()
      // Fallback: match any part of the race name
      const parts = searchTerm.split(' ')
      return parts.some(p => p.length > 4 && title.includes(p)) && title.includes('grand prix')
    })

    if (!raceEvent) {
      return res.status(200).json({ odds: null, marketUrl: null, message: 'No market found yet' })
    }

    // Get markets within this event — find the "Driver Winner" one
    const markets = raceEvent.markets || []
    const winnerMarket = markets.find(m =>
      m.question?.toLowerCase().includes('winner') ||
      m.question?.toLowerCase().includes('win the')
    ) || markets[0]

    if (!winnerMarket) {
      return res.status(200).json({ odds: null, marketUrl: null, message: 'No winner market found' })
    }

    // Parse outcomes and prices
    let outcomes, prices
    try {
      outcomes = typeof winnerMarket.outcomes === 'string'
        ? JSON.parse(winnerMarket.outcomes)
        : winnerMarket.outcomes || []
      prices = typeof winnerMarket.outcomePrices === 'string'
        ? JSON.parse(winnerMarket.outcomePrices)
        : winnerMarket.outcomePrices || []
    } catch {
      return res.status(200).json({ odds: null, message: 'Could not parse odds' })
    }

    // Build odds array sorted by probability
    const odds = outcomes
      .map((name, i) => ({ name, probability: parseFloat(prices[i] || 0) }))
      .filter(o => o.name !== 'Other' && o.probability > 0.01)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 8)

    const marketUrl = `https://polymarket.com/event/${raceEvent.slug}`

    return res.status(200).json({
      odds,
      marketUrl,
      eventTitle: raceEvent.title,
      volume: raceEvent.volume,
    })
  } catch (err) {
    console.error('Polymarket error:', err.message)
    return res.status(200).json({ odds: null, message: err.message })
  }
}
