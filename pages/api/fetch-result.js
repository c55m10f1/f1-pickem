const DRIVERS = [
  'Norris', 'Piastri', 'Russell', 'Hamilton', 'Leclerc', 'Sainz',
  'Verstappen', 'Alonso', 'Stroll', 'Hulkenberg', 'Gasly', 'Doohan',
  'Antonelli', 'Hadjar', 'Lawson', 'Tsunoda', 'Albon', 'Colapinto',
  'Bearman', 'Bortoleto', 'Magnussen', 'Ocon', 'Lindblad',
]

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { raceName } = req.body
  if (!raceName) return res.status(400).json({ error: 'No race name' })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Find the final official podium for the 2026 Formula 1 ${raceName} Grand Prix. Return ONLY valid JSON: {"p1":"LastName","p2":"LastName","p3":"LastName"} using last names from this list: ${DRIVERS.join(', ')}. If the race result is not yet available, return: {"error":"not available"}`
        }]
      })
    })

    const data = await response.json()
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('')
    const match = text.match(/\{[^}]+\}/)
    if (!match) return res.status(200).json({ error: 'Could not parse result' })
    const result = JSON.parse(match[0])
    if (result.error) return res.status(200).json({ error: result.error })
    if (!result.p1 || !result.p2 || !result.p3) return res.status(200).json({ error: 'Incomplete result' })
    return res.status(200).json(result)
  } catch (e) {
    return res.status(200).json({ error: e.message })
  }
}
