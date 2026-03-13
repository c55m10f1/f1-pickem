import { useState, useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import '../styles/globals.css'

function LightsOut({ onComplete }) {
  const [phase, setPhase] = useState(0) // 0-4 = lights turning on, 5 = all out, 6 = done

  useEffect(() => {
    // Light 1 at 200ms, 2 at 600ms, 3 at 1000ms, 4 at 1400ms, 5 at 1800ms
    const timers = []
    for (let i = 0; i < 5; i++) {
      timers.push(setTimeout(() => setPhase(i + 1), 200 + i * 400))
    }
    // All lights out at 2600ms (800ms pause after last light)
    timers.push(setTimeout(() => setPhase(6), 2600))
    // Fade away and complete at 3100ms
    timers.push(setTimeout(() => onComplete(), 3100))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0d0d12',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      opacity: phase >= 6 ? 0 : 1,
      transition: 'opacity 0.5s ease',
      pointerEvents: phase >= 6 ? 'none' : 'all',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div style={{ width: '3px', height: '32px', background: '#E8002D', borderRadius: '1px' }} />
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2.4rem', letterSpacing: '3px', color: '#fff' }}>
            F1 <span style={{ color: '#E8002D' }}>PICK'EM</span>
          </span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.65rem', color: '#555', letterSpacing: '2px' }}>
          2026 SEASON
        </div>
      </div>

      {/* Five lights */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{
            width: '24px', height: '24px', borderRadius: '50%',
            border: '2px solid #2e2e42',
            background: phase >= 6 ? '#1a1a1a' : (phase > i ? '#E8002D' : '#330000'),
            boxShadow: phase >= 6 ? 'none' : (phase > i ? '0 0 16px #E8002D, 0 0 32px #E8002D66' : 'none'),
            transition: phase >= 6 ? 'all 0.15s ease' : 'all 0.15s ease',
          }} />
        ))}
      </div>

      {/* Subtitle */}
      <div style={{
        marginTop: '32px',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: '0.58rem',
        color: phase >= 6 ? '#E8002D' : '#4a4a5a',
        letterSpacing: '3px',
        transition: 'color 0.3s ease',
      }}>
        {phase >= 6 ? 'GO GO GO!' : phase >= 5 ? 'LIGHTS OUT AND AWAY WE GO' : ''}
      </div>
    </div>
  )
}

export default function App({ Component, pageProps }) {
  const [session, setSession] = useState(null)
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLights, setShowLights] = useState(true)

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
      {showLights && <LightsOut onComplete={() => setShowLights(false)} />}
      <Component {...pageProps} session={session} player={player} loading={loading} />
    </>
  )
}
