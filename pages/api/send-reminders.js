import { createClient } from '@supabase/supabase-js'
import { RACES } from '../../lib/data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CRON_SECRET = process.env.CRON_SECRET

// Format phone to E.164 — handles 10-digit, 11-digit, or already formatted
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
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()

  const cronHeader = req.headers['authorization']
  const isVercelCron = cronHeader === `Bearer ${CRON_SECRET}`
  const isManual = req.query.secret === CRON_SECRET

  if (CRON_SECRET && !isVercelCron && !isManual) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const now = new Date()
  const sent = []
  const errors = []

  // Get already-locked races and existing picks
  const [{ data: locks }, { data: picks }, { data: players }, { data: sentLog }] = await Promise.all([
    supabase.from('race_locks').select('race_id'),
    supabase.from('picks').select('player_id, race_id, dns'),
    supabase.from('players').select('*'),
    supabase.from('sms_log').select('player_id, race_id, reminder_type'),
  ])

  const lockedIds = new Set((locks || []).map(l => l.race_id))

  // Find the next unlocked race with a qualiLock in the future
  const nextRace = RACES.find(r => {
    if (!r.qualiLock) return false
    if (lockedIds.has(r.id)) return false
    return new Date(r.qualiLock) > now
  })

  if (!nextRace) {
    return res.status(200).json({ message: 'No upcoming unlocked race', checked: now.toISOString() })
  }

  const lockTime = new Date(nextRace.qualiLock)
  const hoursUntilLock = (lockTime - now) / (1000 * 60 * 60)

  // Determine which reminder window we're in
  let reminderType = null
  if (hoursUntilLock <= 2) {
    reminderType = '2hr'
  } else if (hoursUntilLock <= 24) {
    reminderType = '24hr'
  }

  if (!reminderType) {
    return res.status(200).json({
      message: `Next lock: ${nextRace.name} in ${Math.round(hoursUntilLock)}hrs — too early for reminders`,
      checked: now.toISOString()
    })
  }

  // Find players who haven't picked yet
  const alreadySent = new Set(
    (sentLog || [])
      .filter(s => s.race_id === nextRace.id && s.reminder_type === reminderType)
      .map(s => s.player_id)
  )

  for (const player of (players || [])) {
    // Skip if no phone number
    const phone = formatPhone(player.phone)
    if (!phone) continue

    // Skip if already picked (non-DNS)
    const hasPick = (picks || []).find(p => p.player_id === player.id && p.race_id === nextRace.id && !p.dns)
    if (hasPick) continue

    // Skip if already sent this reminder
    if (alreadySent.has(player.id)) continue

    // Build message
    const urgent = reminderType === '2hr'
    const message = urgent
      ? `🏎️ F1 Pick'em: Picks lock in 2 HOURS for the ${nextRace.name} GP! Don't miss out — pick now at f1-pickem-six.vercel.app`
      : `🏎️ F1 Pick'em: Picks lock in 24 hours for the ${nextRace.name} GP! Make your selections now at f1-pickem-six.vercel.app`

    try {
      const sid = await sendSMS(phone, message)
      sent.push({ player: player.name, type: reminderType, sid })

      // Log it so we don't double-send
      await supabase.from('sms_log').insert({
        player_id: player.id,
        race_id: nextRace.id,
        reminder_type: reminderType,
        sent_at: now.toISOString(),
      })
    } catch (e) {
      errors.push({ player: player.name, error: e.message })
    }
  }

  return res.status(200).json({
    race: nextRace.name,
    reminderType,
    hoursUntilLock: Math.round(hoursUntilLock * 10) / 10,
    sent,
    errors,
    checked: now.toISOString()
  })
}
