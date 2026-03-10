import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import '../styles/globals.css'

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
    let attempts = 0
    while (attempts < 5) {
      const { data } = await supabase.from('players').select('*').eq('id', userId).maybeSingle()
      if (data) { setPlayer(data); setLoading(false); return }
      attempts++
      await new Promise(r => setTimeout(r, 800))
    }
    setLoading(false)
  }

  return (
    <>
      <Head>
        <title>F1 Pick&apos;Em 2026</title>
        <meta name="description" content="F1 Pick'Em Pool 2026 — predict the podium every race weekend." />
        <meta property="og:title" content="F1 Pick'Em 2026" />
        <meta property="og:description" content="Predict the podium every race weekend. Who will you pick?" />
        <meta property="og:image" content="https://f1-pickem-six.vercel.app/og-image.png" />
        <meta property="og:url" content="https://f1-pickem-six.vercel.app" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://f1-pickem-six.vercel.app/og-image.png" />
      </Head>
      <Component {...pageProps} session={session} player={player} loading={loading} />
    </>
  )
}
