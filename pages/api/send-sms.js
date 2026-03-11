import { createClient } from '@supabase/supabase-js'
import { RACES } from '../../lib/data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function formatPhone(phone) {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (phone.startsWith('+')) return phone
  return null
}

async function sendSMS(to, body) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  })

  const data = await res.json()
  if (data.error_code) throw new Error(`Twilio error ${data.error_code}: ${data.error_message}`)
  return data.sid
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { player_id, message_type, custom_message } = req.body
  if (!player_id) return res.status(400).json({ error: 'player_id required' })

  // Get the player
  const { data: player } = await supabase.from('players').select('*').eq('id', player_id).single()
  if (!player) return res.status(404).json({ error: 'Player not found' })

  const phone = formatPhone(player.phone)
  if (!phone) return res.status(400).json({ error: `${player.name} has no phone number` })

  // Find next race for template messages
  const { data: locks } = await supabase.from('race_locks').select('race_id')
  const { data: results } = await supabase.from('race_results').select('race_id')
  const lockedIds = new Set((locks || []).map(l => l.race_id))
  const resultIds = new Set((results || []).map(r => r.race_id))
  const nextRace = RACES.find(r => !lockedIds.has(r.id) && !resultIds.has(r.id))
  const raceName = nextRace?.name || 'the next'

  // Build message
  let message
  switch (message_type) {
    case '24hr':
      message = `🏎️ F1 Pick'em: Picks lock in 24 hours for the ${raceName} GP! Make your selections now at f1-pickem-six.vercel.app`
      break
    case '2hr':
      message = `🏎️ F1 Pick'em: Picks lock in 2 HOURS for the ${raceName} GP! Don't miss out — pick now at f1-pickem-six.vercel.app`
      break
    case 'results':
      message = `🏁 F1 Pick'em: The ${raceName} GP results are in! See who nailed it — check the leaderboard at f1-pickem-six.vercel.app`
      break
    case 'custom':
      message = custom_message
      break
    default:
      message = custom_message || `🏎️ F1 Pick'em reminder: f1-pickem-six.vercel.app`
  }

  if (!message) return res.status(400).json({ error: 'No message content' })

  try {
    const sid = await sendSMS(phone, message)
    return res.status(200).json({ success: true, sid, player: player.name })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}
