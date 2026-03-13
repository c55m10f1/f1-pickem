import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import RaceCountdown from '../components/RaceCountdown'
import { Card } from '../components/ui'
import { supabase } from '../lib/supabase'
import { RACES, calcScore } from '../lib/data'

export default function Home({ session, player, loading }) {
  const [picks, setPicks] = useState([])
  const [results, setResults] = useState([])
  const [players, setPlayers] = useState([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: ps }, { data: pks }, { data: rs }] = await Promise.all([
      supabase.from('players').select('*'),
      supabase.from('picks').select('*'),
      supabase.from('race_results').select('*'),
    ])
    setPlayers(ps || [])
    setPicks(pks || [])
    setResults(rs || [])
    setDataLoading(false)
  }

  const scored = RACES.filter(r => results.find(res => res.race_id === r.id)).length

  function getPlayerTotal(playerId) {
    let total = 0, races = 0, bonus = 0
    RACES.forEach(r => {
      const result = results.find(res => res.race_id === r.id)
      const pick = picks.find(p => p.player_id === playerId && p.race_id === r.id)
      if (!result || !pick || pick.dns) return
      const sc = calcScore(pick, result)
      total += sc.total; races++; bonus += sc.bonus
    })
    return { total, races, bonus }
  }

  const sorted = [...players].sort((a, b) => getPlayerTotal(b.id).total - getPlayerTotal(a.id).total)
  const medals = ['🥇', '🥈', '🥉']
  const podiumColors = ['#FFD060', '#C0C8D8', '#CD8B5A']
  const podiumBgs = [
    'linear-gradient(90deg,#1e1a00,#13131b)',
    'linear-gradient(90deg,#10161e,#13131b)',
    'linear-gradient(90deg,#1a1008,#13131b)',
  ]
  const lastRace = [...RACES].reverse().find(r => results.find(res => res.race_id === r.id))

  if (loading || dataLoading) return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
      <div style={{color:"#E8002D",fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",letterSpacing:"4px"}}>LOADING…</div>
    </div>
  )

  return (
    <Layout session={session} player={player}>
      <div className="fade-up">
        <div className="mb-6">
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.5rem",letterSpacing:"4px",lineHeight:1}}>STANDINGS</h1>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.6rem",color:"#aaa",marginTop:"6px",letterSpacing:"1px"}}>
            2026 · {scored}/24 RACES{lastRace ? ` · LAST: ${lastRace.name.toUpperCase()}` : ''}
          </div>
        </div>

        {/* Race countdown — shows 5 days before race */}
        {(() => {
          const nextRace = RACES.find(r => new Date(r.raceStart) > new Date())
          return nextRace ? <RaceCountdown race={nextRace} /> : null
        })()}

        <div className="flex flex-col gap-3 mb-8">
          {sorted.map((p, i) => {
            const d = getPlayerTotal(p.id)
            const top = i < 3
            return (
              <div key={p.id} className="card-stagger card-hover" style={{
                display:'grid',gridTemplateColumns:'46px 1fr auto',gap:'12px',alignItems:'center',
                background: top ? podiumBgs[i] : '#13131b',
                border: `1px solid ${top ? podiumColors[i] + '44' : '#1e1e2c'}`,
                borderRadius:'10px',padding:'14px 18px',
                animationDelay: `${i * 80}ms`,
              }}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:top?'2rem':'1.1rem',
                  color:top?podiumColors[i]:'#2e2e42',lineHeight:1,textAlign:'center'}}>
                  {top ? medals[i] : i + 1}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:'1rem'}}>{p.name}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.6rem",color:"#aaa",marginTop:'2px'}}>
                    {d.races} races · +{d.bonus} bonus pts
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'2.2rem',
                    color:top?podiumColors[i]:'#5a9abf',letterSpacing:'1px',lineHeight:1}}>{d.total}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:'0.55rem',color:'#2e2e42'}}>PTS</div>
                </div>
              </div>
            )
          })}
          {sorted.length === 0 && (
            <Card><div className="text-[#bbb] text-sm text-center py-4">No players yet — season hasn't started!</div></Card>
          )}
        </div>

        <Card>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.8rem",letterSpacing:"2px",color:"#aaa",marginBottom:"12px"}}>SCORING RULES</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              ['1 pt',   'Correct driver on podium'],
              ['+3 pts', 'Picked winner (1st) ✓'],
              ['+2 pts', 'Picked 2nd place ✓'],
              ['+1 pt',  'Picked 3rd place ✓'],
              ['+5 pts', 'Perfect 1-2-3 🔥'],
              ['+3 pts', 'All 3 right, wrong order'],
            ].map(([pts, desc]) => (
              <div key={desc} className="flex items-center gap-2 text-sm">
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.68rem",color:"#c8a820",minWidth:"46px",textAlign:"right"}}>{pts}</span>
                <span className="text-[#aaa]">{desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
