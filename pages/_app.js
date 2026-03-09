import '../styles/globals.css'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function App({ Component, pageProps }) {
  const [session, setSession] = useState(null)
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchPlayer(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchPlayer(session.user.id)
      else { setPlayer(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchPlayer(userId) {
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from('players')
        .select('id, email, name, is_commissioner')
        .eq('id', userId)
        .maybeSingle()
      if (data) {
        setPlayer(data)
        setLoading(false)
        return
      }
      await new Promise(r => setTimeout(r, 600))
    }
    setLoading(false)
  }

  return (
    <Component
      {...pageProps}
      session={session}
      player={player}
      loading={loading}
      refreshPlayer={() => session && fetchPlayer(session.user.id)}
    />
  )
}
