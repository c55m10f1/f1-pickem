import { createClient } from '@supabase/supabase-js'

// Uses service role key to bypass RLS for server-side player creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { userId, email, name } = req.body
  if (!userId || !email || !name) return res.status(400).json({ error: 'Missing fields' })

  const { error } = await supabaseAdmin.from('players').upsert({
    id: userId,
    email,
    name,
    is_commissioner: false,
  }, { onConflict: 'id' })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json({ ok: true })
}
