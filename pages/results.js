import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import { Card } from '../components/ui'
import { supabase } from '../lib/supabase'
import { RACES, calcScore } from '../lib/data'

export default function Results({ session, player, loading }) {
  const [picks, setPicks] = useState([])
  const [results, setResults] = useState([])
  const [players, setPlayers] = useState([])
  const [raceId, setRaceId] = useState(RACES[0].id)

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
    const last = [...RACES].reverse().find(r => (rs || []).find(res => res.race_id === r.id))
    if (last) setRaceId(last.id)
  }

  const race = RACES.find(r => r.id === raceId)
  const result = results.find(r => r.race_id === raceId) || null
  const hasResult = !!result
  
  return (
    <Layout session={session} player={player}>
      <div className="fade-up">
        <div className="mb-5">
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",letterSpacing:"3px"}}>RACE RESULTS</h1>
        </div>

        <select value={raceId} onChange={e => setRaceId(e.target.value)} className="mb-5">
          {RACES.map(r => (
            <option key={r.id} value={r.id}>{r.name} — {r.date}{results.find(res=>res.race_id===r.id)?' ✓':''}</option>
          ))}
        </select>

        <Card className="!p-0 overflow-hidden" key={raceId + (result ? '1' : '0')}>
          {/* Race header */}
          <div className="bg-[#111118] px-4 py-3 border-b border-[#1e1e2c] flex justify-between items-center">
            <div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.3rem",letterSpacing:"2px"}}>{race?.name}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.6rem",color:"#444"}}>{race?.date}</div>
            </div>
            <span className={`text-[11px] font-mono px-2.5 py-1 rounded border ${result ? 'bg-green-950 border-green-900 text-green-400' : 'bg-[#1a1a24] border-[#2e2e42] text-[#555]'}`}>
              {result ? '✓ FINAL' : 'PENDING'}
            </span>
          </div>

          {/* Podium */}
          {result && (
            <div className="bg-[#0d0d14] px-4 py-2.5 border-b border-[#1e1e2c] flex gap-4 font-mono text-sm">
              {[['P1', result.p1, '#FFD060'], ['P2', result.p2, '#C0C8D8'], ['P3', result.p3, '#CD8B5A']].map(([pos, drv, col]) => (
                <span key={pos}>
                  <span className="text-[#333]">{pos} </span>
                  <span style={{color: col, fontWeight: 700}}>{drv}</span>
                </span>
              ))}
            </div>
          )}

          {/* Column headers */}
          {result && (
            <div className="grid px-4 py-2 border-b border-[#1e1e2c]"
              style={{gridTemplateColumns:'90px 1fr 36px 36px 36px 46px 46px',gap:'4px'}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:"#333"}}>PLAYER</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:"#333"}}>PICKS</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:"#333",textAlign:'center'}}>P1</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:"#333",textAlign:'center'}}>P2</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:"#333",textAlign:'center'}}>P3</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:"#333",textAlign:'center'}}>BONUS</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.55rem",color:"#333",textAlign:'center'}}>TOTAL</div>
            </div>
          )}

          {/* Player rows */}
          <div>
            {players.map((p, i) => {
              const pk = picks.find(pk => pk.player_id === p.id && pk.race_id === raceId)
              const sc = pk && !pk.dns && result ? calcScore(pk, result) : null
              const actual = result ? [result.p1, result.p2, result.p3] : []
              const exactMatch = (d, j) => result && d === actual[j]
              const wrongSpot = (d, j) => result && !exactMatch(d, j) && actual.includes(d)
              const driverColor = (d, j) => exactMatch(d, j) ? '#2ECC71' : wrongSpot(d, j) ? '#7ec8f0' : '#4a4a5a'
              const driverWeight = (d, j) => (exactMatch(d, j) || wrongSpot(d, j)) ? 700 : 400
              const isPerfect = sc && sc.bonus === 5
              const isAllRight = sc && sc.bonus === 3
              const ptColor = (v) => v > 0 ? '#eef0f5' : '#2a2a3a'

              return (
                <div key={p.id} className="grid px-4 py-3 items-center"
                  style={{gridTemplateColumns: result ? '90px 1fr 36px 36px 36px 46px 46px' : '90px 1fr auto',
                    gap:'4px', borderBottom: i < players.length - 1 ? '1px solid #0e0e16' : 'none',
                    background: i % 2 === 0 ? 'transparent' : '#11111a'}}>

                  <div className="font-semibold text-sm">{p.name}</div>

                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.68rem",display:"flex",gap:"3px",alignItems:"center",flexWrap:"wrap"}}>
                    {!pk ? <span className="text-[#2a2a3a]">no pick</span>
                      : pk.dns ? <span className="text-red-500">DNS</span>
                      : <>
                          {[pk.p1, pk.p2, pk.p3].map((d, j) => (
                            <span key={j}>
                              <span style={{color: driverColor(d,j), fontWeight: driverWeight(d,j)}}>{d}</span>
                              {j < 2 && <span className="text-[#2a2a3a]"> / </span>}
                            </span>
                          ))}
                          {isPerfect && <span style={{marginLeft:'5px'}}>🤯</span>}
                          {isAllRight && <span style={{marginLeft:'5px'}}>🥂</span>}
                        </>
                    }
                  </div>

                  {result && sc ? (<>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.75rem",textAlign:'center',color:ptColor(sc.p1),fontWeight:sc.p1>0?700:400}}>{sc.p1}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.75rem",textAlign:'center',color:ptColor(sc.p2),fontWeight:sc.p2>0?700:400}}>{sc.p2}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.75rem",textAlign:'center',color:ptColor(sc.p3),fontWeight:sc.p3>0?700:400}}>{sc.p3}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.75rem",textAlign:'center',color:sc.bonus>0?'#FFD060':'#2a2a3a',fontWeight:sc.bonus>0?700:400}}>
                      {sc.bonus > 0 ? `+${sc.bonus}` : '—'}
                    </div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.2rem",textAlign:'center',
                      color: sc.total >= 8 ? '#FFD060' : sc.total >= 5 ? '#5a9abf' : sc.total > 0 ? '#eef0f5' : '#2a2a3a'}}>
                      {sc.total}
                    </div>
                  </>) : result ? (<>
                    <div style={{textAlign:'center',color:'#2a2a3a'}}>—</div>
                    <div style={{textAlign:'center',color:'#2a2a3a'}}>—</div>
                    <div style={{textAlign:'center',color:'#2a2a3a'}}>—</div>
                    <div style={{textAlign:'center',color:'#2a2a3a'}}>—</div>
                    <div style={{textAlign:'center',color:'#2a2a3a'}}>—</div>
                  </>) : null}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
