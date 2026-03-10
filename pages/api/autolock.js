import { createClient } from '@supabase/supabase-js'
import { RACES } from '../../lib/data'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Secret token to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET

export default async function handler(req, res) {
  // Verify this is called by Vercel cron or commissioner
  if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).end()

  // Vercel cron sends this header automatically
  const cronHeader = req.headers['authorization']
  const isVercelCron = cronHeader === `Bearer ${CRON_SECRET}`
  const isManual = req.query.secret === CRON_SECRET

  if (CRON_SECRET && !isVercelCron && !isManual) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const now = new Date()

  // Get already-locked races
  const { data: existingLocks } = await supabase.from('race_locks').select('race_id')
  const lockedIds = new Set((existingLocks || []).map(l => l.race_id))

  const toLock = RACES.filter(r => {
    if (!r.qualiLock) return false
    if (lockedIds.has(r.id)) return false
    return new Date(r.qualiLock) <= now
  })

  if (toLock.length === 0) {
    return res.status(200).json({ message: 'Nothing to lock', checked: now.toISOString() })
  }

  const locked = []
  const errors = []

  for (const race of toLock) {
    // Lock the race
    const { error: lockError } = await supabase
      .from('race_locks')
      .upsert({ race_id: race.id, locked_at: now.toISOString() }, { onConflict: 'race_id' })

    if (lockError) {
      errors.push({ race: race.id, error: lockError.message })
      continue
    }

    // Trigger autopick for players who haven't submitted
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${req.headers.host}`
      await fetch(`${baseUrl}/api/autopick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ race_id: race.id })
      })
    } catch (e) {
      // Non-fatal — race is still locked even if autopick fails
      errors.push({ race: race.id, error: `autopick failed: ${e.message}` })
    }

    locked.push(race.id)
  }

  return res.status(200).json({
    locked,
    errors,
    checked: now.toISOString()
  })
}
