import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import RaceCountdown from '../components/RaceCountdown'
import { Card, Label, Btn, Toast, Badge } from '../components/ui'
import { supabase } from '../lib/supabase'
import { RACES, DRIVERS, calcScore } from '../lib/data'

export default function Picks({ session, player, loading }) {
  const router = useRouter()
  const [raceId, setRaceId] = useState(RACES[0].id)
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [p3, setP3] = useState('')
  const [myPicks, setMyPicks] = useState([])
  const [allPicks, setAllPicks] = useState([])
  const [allPlayers, setAllPlayers] = useState([])
  const [results, setResults] = useState([])
  const [locks, setLocks] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [aiOdds, setAiOdds] = useState(null)
  const [aiSummary, setAiSummary] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [aiCachedAt, setAiCachedAt] = useState(null)

  useEffect(() => { if (!loading && !session) router.push('/login') }, [loading, session])
  useEffect(() => { if (player) loadData() }, [player])

  async function loadData() {
    const [{ data: pks }, { data: rs }, { data: lks }, { data: apks }, { data: ps }] = await Promise.all([
      supabase.from('picks').select('*').eq('player_id', player.id),
      supabase.from('race_results').select('*'),
      supabase.from('race_locks').select('*'),
      supabase.from('picks').select('*'),
      supabase.from('players').select('*'),
    ])
    setMyPicks(pks || [])
    setResults(rs || [])
    setLocks(lks || [])
    setAllPicks(apks || [])
    setAllPlayers(ps || [])
  }

  // Set default race to next open race
  useEffect(() => {
    const open = RACES.find(r => !locks.find(l => l.race_id === r.id) && !results.find(res => res.race_id === r.id))
    if (open) setRaceId(open.id)
  }, [locks, results])

  const race = RACES.find(r => r.id === raceId)
  const isLocked = !!locks.find(l => l.race_id === raceId)
  const hasResult = !!results.find(r => r.race_id === raceId)
  const readonly = isLocked || hasResult
  const existing = myPicks.find(p => p.race_id === raceId)

  // Reset odds when race changes — user must click to fetch
  useEffect(() => {
    setAiOdds(null)
    setAiSummary(null)
    setAiError(null)
    setAiCachedAt(null)
  }, [raceId])

  useEffect(() => {
    if (existing && !existing.dns) { setP1(existing.p1 || ''); setP2(existing.p2 || ''); setP3(existing.p3 || '') }
    else { setP1(''); setP2(''); setP3('') }
  }, [raceId, myPicks])

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3400) }

  const save = async () => {
    if (readonly) return showToast(hasResult ? 'Race already scored 🔒' : 'Qualifying has started — picks locked 🔒', 'err')
    if (!p1 || !p2 || !p3) return showToast('Fill in all 3 picks', 'err')
    if (new Set([p1, p2, p3]).size < 3) return showToast('Pick 3 different drivers', 'err')
    setSaving(true)
    const { error } = await supabase.from('picks').upsert({
      player_id: player.id, race_id: raceId, p1, p2, p3, dns: false,
      updated_at: new Date().toISOString()
    }, { onConflict: 'player_id,race_id' })
    if (error) showToast('Error saving picks', 'err')
    else { showToast(`✅ Picks saved for ${race.name}!`); await loadData() }
    setSaving(false)
  }

  const avail = (ex = []) => DRIVERS.filter(d => !ex.includes(d))

  const fetchAiOdds = async (force = false) => {
    const currentRace = RACES.find(r => r.id === raceId)
    if (!currentRace) return
    setAiLoading(true)
    setAiError(null)
    try {
      const res = await fetch('/api/race-odds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ race_id: raceId, race_name: currentRace.name, force })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAiOdds(data.odds)
      setAiSummary(data.summary)
      setAiCachedAt(data.cached_at || new Date().toISOString())
    } catch (e) {
      setAiError('Could not load odds. Try again.')
    }
    setAiLoading(false)
  }

  if (loading || !player) return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center">
      <div style={{color:"#E8002D",fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",letterSpacing:"4px"}}>LOADING…</div>
    </div>
  )

  return (
    <Layout session={session} player={player}>
      <div className="fade-up">
        <div className="mb-5">
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",letterSpacing:"3px"}}>{player.name.toUpperCase()}'S PICKS</h1>
          <div className="text-sm text-[#555] mt-1">Picks lock automatically at qualifying time. You can't change picks after that.</div>
        </div>

        {/* Race countdown — shows 5 days before race */}
        {(() => {
          const nextRace = RACES.find(r => new Date(r.raceStart) > new Date())
          return nextRace ? <RaceCountdown race={nextRace} /> : null
        })()}

        <Card className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <Label>RACE</Label>
            <Badge locked={readonly} />
          </div>
          <select value={raceId} onChange={e => setRaceId(e.target.value)} className="mb-3">
            {RACES.map(r => {
              const lk = !!locks.find(l => l.race_id === r.id)
              const res = !!results.find(res => res.race_id === r.id)
              return <option key={r.id} value={r.id}>{r.name} — {r.date}{lk ? ' 🔒' : ''}{res ? ' ✓' : ''}</option>
            })}
          </select>

          {existing?.dns && !readonly && (
            <div className="bg-red-950 border border-red-900 rounded-lg px-3 py-2 mb-3 text-sm text-red-300">
              Currently DNS — save new picks to override.
            </div>
          )}

          {readonly ? (
            <div className="bg-[#111118] border border-[#1e1e2c] rounded-lg p-4">
              <Label>YOUR SUBMISSION</Label>
              {!existing ? (
                <div className="text-[#444] text-sm">No pick submitted for this race.</div>
              ) : existing.dns ? (
                <div className="text-[#E8002D] font-mono">DNS — did not submit</div>
              ) : (
                <div className="flex gap-6 mt-1">
                  {[['🥇', existing.p1], ['🥈', existing.p2], ['🥉', existing.p3]].map(([m, d]) => (
                    <div key={m} className="text-center">
                      <div className="text-2xl">{m}</div>
                      <div className="font-bold mt-1">{d}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[['🥇 1ST', p1, setP1, [p2, p3]], ['🥈 2ND', p2, setP2, [p1, p3]], ['🥉 3RD', p3, setP3, [p1, p2]]].map(([lbl, val, set, ex]) => (
                  <div key={lbl}>
                    <Label>{lbl}</Label>
                    <select value={val} onChange={e => set(e.target.value)}>
                      <option value="">—</option>
                      {avail(ex).map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Btn red full onClick={save} disabled={saving}>SAVE PICKS</Btn>
              </div>
              <div className="text-xs mt-2" style={{color:'#333',fontFamily:"'JetBrains Mono',monospace"}}>
                Miss the deadline? You get 2 random autopicks/season. After that, DNS = 0 pts.
              </div>
            </>
          )}
        </Card>

        {/* AI Odds Panel */}
        {!hasResult && (
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.8rem",letterSpacing:"2px",color:"#333"}}>
                AI RACE ODDS
              </div>
              <span style={{fontSize:"0.6rem",color:"#2a2a3a",letterSpacing:"1px",fontFamily:"'JetBrains Mono',monospace"}}>
                powered by claude
              </span>
            </div>

            {!aiOdds && !aiLoading && (
              <div className="flex flex-col gap-2">
                <div style={{color:"#444",fontSize:"0.75rem",fontFamily:"'JetBrains Mono',monospace",marginBottom:"8px"}}>
                  Get AI-powered win probabilities based on current form, qualifying, and betting lines.
                </div>
                <button onClick={fetchAiOdds}
                  style={{
                    background:'#1a0808',border:'1px solid #E8002D',color:'#E8002D',
                    borderRadius:'6px',padding:'8px 16px',cursor:'pointer',
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.85rem",letterSpacing:"2px",
                    width:'100%'
                  }}>
                  🔍 CHECK ODDS
                </button>
                {aiError && <div style={{color:'#E8002D',fontSize:'0.7rem',fontFamily:"'JetBrains Mono',monospace"}}>{aiError}</div>}
              </div>
            )}

            {aiLoading && (
              <div style={{color:"#E8002D",fontSize:"0.75rem",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"2px"}}>
                ANALYSING THE GRID…
              </div>
            )}

            {aiOdds && (
              <div>
                {aiSummary && (
                  <div style={{
                    fontFamily:"Georgia,serif",fontSize:"0.8rem",lineHeight:"1.6",
                    color:"#888",marginBottom:"14px",
                    borderLeft:"2px solid #E8002D",paddingLeft:"10px"
                  }}>
                    {aiSummary}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {aiOdds.map((d, i) => (
                    <div key={d.driver} className="flex items-center gap-2">
                      <div style={{
                        fontFamily:"'JetBrains Mono',monospace",fontSize:"0.7rem",
                        color: i === 0 ? '#FFD060' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#555',
                        width:'80px',flexShrink:0
                      }}>{d.driver}</div>
                      <div className="flex-1" style={{height:'6px',background:'#111118',borderRadius:'3px'}}>
                        <div style={{
                          width:`${Math.round(d.probability*100)}%`,height:'100%',borderRadius:'3px',
                          background: i===0?'#E8002D':i===1?'#4e6bff':'#2a2a4a',
                          transition:'width 0.5s ease'
                        }}/>
                      </div>
                      <div style={{
                        fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.85rem",
                        color:i===0?'#FFD060':'#555',width:'36px',textAlign:'right',flexShrink:0
                      }}>{Math.round(d.probability*100)}%</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between" style={{marginTop:'12px'}}>
                  {aiCachedAt && (
                    <div style={{fontSize:'0.58rem',color:'#2a2a3a',fontFamily:"'JetBrains Mono',monospace"}}>
                      updated {new Date(aiCachedAt).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}
                    </div>
                  )}
                  <button onClick={() => fetchAiOdds(true)}
                    style={{marginLeft:'auto',background:'none',border:'none',color:'#555',
                      fontSize:'0.65rem',fontFamily:"'JetBrains Mono',monospace",cursor:'pointer'}}>
                    ↺ refresh now
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Everyone's Picks — visible after lock */}
        {(isLocked || hasResult) && (
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.8rem",letterSpacing:"2px",color:"#333"}}>
                EVERYONE'S PICKS
              </div>
              <div style={{fontSize:"0.6rem",color:"#2a2a3a",letterSpacing:"1px",fontFamily:"'JetBrains Mono',monospace"}}>
                {hasResult ? '✓ scored' : '🔒 locked'}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {allPlayers.sort((a,b) => a.name.localeCompare(b.name)).map(p => {
                const pk = allPicks.find(pk => pk.player_id === p.id && pk.race_id === raceId)
                const isMe = p.id === player.id
                const result = results.find(r => r.race_id === raceId)
                // Score each pick position if result exists
                const score = (driver, pos) => {
                  if (!result || !pk || pk.dns) return null
                  const podium = [result.p1, result.p2, result.p3]
                  if (!podium.includes(driver)) return 'miss'
                  if (result[`p${pos}`] === driver) return 'exact'
                  return 'hit'
                }
                return (
                  <div key={p.id} style={{
                    borderLeft: isMe ? '2px solid #E8002D' : '2px solid #1e1e2c',
                    paddingLeft: '10px'
                  }}>
                    <div className="flex items-center gap-2 mb-1">
                      <div style={{
                        fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.85rem",letterSpacing:"2px",
                        color: isMe ? '#E8002D' : '#888'
                      }}>
                        {p.name.toUpperCase()}
                        {isMe && <span style={{fontSize:"0.55rem",marginLeft:"6px",color:"#444"}}>YOU</span>}
                      </div>
                      {pk?.is_autopick && (
                        <span style={{fontSize:"0.55rem",color:"#FFD060",fontFamily:"'JetBrains Mono',monospace"}}>🎲 auto</span>
                      )}
                    </div>
                    {!pk || pk.dns ? (
                      <div style={{fontSize:"0.7rem",color:"#333",fontFamily:"'JetBrains Mono',monospace"}}>DNS</div>
                    ) : (
                      <div className="flex gap-3">
                        {[['🥇', pk.p1, 1], ['🥈', pk.p2, 2], ['🥉', pk.p3, 3]].map(([medal, driver, pos]) => {
                          const s = score(driver, pos)
                          const col = s === 'exact' ? '#4ade80' : s === 'hit' ? '#60a5fa' : s === 'miss' ? '#333' : '#aaa'
                          return (
                            <div key={pos} className="flex items-center gap-1">
                              <span style={{fontSize:'0.8rem'}}>{medal}</span>
                              <span style={{
                                fontFamily:"'JetBrains Mono',monospace",fontSize:"0.72rem",
                                fontWeight:'600', color: col
                              }}>{driver}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {!hasResult && (
              <div style={{marginTop:'14px',fontSize:'0.62rem',color:'#2a2a3a',fontFamily:"'JetBrains Mono',monospace"}}>
                colour coding appears once results are entered
              </div>
            )}
          </Card>
        )}

        {/* Season history */}
        <Card>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.8rem",letterSpacing:"2px",color:"#333",marginBottom:"14px"}}>SEASON HISTORY</div>
          <div className="flex flex-col">
            {RACES.map(r => {
              const pk = myPicks.find(p => p.race_id === r.id)
              const res = results.find(res => res.race_id === r.id)
              if (!pk && !res) return null
              const sc = pk && !pk.dns && res ? calcScore(pk, res) : null
              return (
                <div key={r.id} className="grid gap-2 items-center py-2 border-b border-[#111118] text-sm"
                  style={{gridTemplateColumns:'90px 1fr 44px'}}>
                  <div className="font-semibold" style={{color: res ? '#ccc' : '#555'}}>{r.name}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.68rem",color:"#444"}}>
                    {pk?.dns ? <span className="text-red-500">DNS</span>
                      : pk ? `${pk.p1} / ${pk.p2} / ${pk.p3}`
                      : <span className="text-[#2a2a3a]">—</span>}
                  </div>
                  <div className="text-right" style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",
                    color: sc ? (sc.total >= 8 ? '#FFD060' : sc.total >= 5 ? '#5a9abf' : '#3a3a4a') : '#2a2a3a'}}>
                    {sc ? sc.total : '—'}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
      <Toast toast={toast} />
    </Layout>
  )
}
