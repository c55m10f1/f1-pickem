import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { Card, Label, Btn, Toast, Badge } from '../components/ui'
import { supabase } from '../lib/supabase'
import { RACES, DRIVERS, calcScore } from '../lib/data'

export default function Picks({ session, player, loading }) {
  const router = useRouter()
  const [raceId, setRaceId] = useState(RACES[0].id)
  const [p1, setP1] = useState(''); const [p2, setP2] = useState(''); const [p3, setP3] = useState('')
  const [myPicks, setMyPicks] = useState([])
  const [results, setResults] = useState([])
  const [locks, setLocks] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [polyOdds, setPolyOdds] = useState(null)
  const [polyUrl, setPolyUrl] = useState(null)
  const [polyLoading, setPolyLoading] = useState(false)

  useEffect(() => { if (!loading && !session) router.push('/login') }, [loading, session])
  useEffect(() => { if (player) loadData() }, [player])

  async function loadData() {
    const [{ data: pks }, { data: rs }, { data: lks }] = await Promise.all([
      supabase.from('picks').select('*').eq('player_id', player.id),
      supabase.from('race_results').select('*'),
      supabase.from('race_locks').select('*'),
    ])
    setMyPicks(pks || [])
    setResults(rs || [])
    setLocks(lks || [])
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

  useEffect(() => {
    setPolyOdds(null)
    setPolyUrl(null)
    if (!hasResult) {
      setPolyLoading(true)
      fetch(`/api/polymarket?race_id=${raceId}`)
        .then(r => r.json())
        .then(data => {
          setPolyOdds(data.odds || null)
          setPolyUrl(data.marketUrl || null)
        })
        .catch(() => {})
        .finally(() => setPolyLoading(false))
    }
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

  const dns = async () => {
    if (readonly) return showToast('Picks are locked', 'err')
    setSaving(true)
    await supabase.from('picks').upsert({
      player_id: player.id, race_id: raceId, p1: null, p2: null, p3: null, dns: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'player_id,race_id' })
    showToast(`Marked DNS for ${race.name}`)
    await loadData()
    setSaving(false)
  }

  const avail = (ex = []) => DRIVERS.filter(d => !ex.includes(d))

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
          <div className="text-sm text-[#555] mt-1">Picks lock when the commissioner opens qualifying. You can't change picks after that.</div>
        </div>

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
                <Btn ghost onClick={dns} disabled={saving}>DNS</Btn>
              </div>
            </>
          )}
        </Card>

        {/* Polymarket Odds Panel */}
        {!hasResult && (
          <Card className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.8rem",letterSpacing:"2px",color:"#333"}}>
                RACE WINNER ODDS
              </div>
              {polyUrl ? (
                <a href={polyUrl} target="_blank" rel="noopener noreferrer"
                  style={{fontSize:"0.65rem",color:"#4e6bff",letterSpacing:"1px",textDecoration:"none",fontFamily:"'Bebas Neue',sans-serif"}}>
                  POLYMARKET ↗
                </a>
              ) : (
                <span style={{fontSize:"0.65rem",color:"#333",letterSpacing:"1px",fontFamily:"'Bebas Neue',sans-serif"}}>POLYMARKET</span>
              )}
            </div>

            {polyLoading ? (
              <div style={{color:"#333",fontSize:"0.75rem",fontFamily:"'JetBrains Mono',monospace"}}>Loading odds…</div>
            ) : !polyOdds ? (
              <div style={{color:"#2a2a3a",fontSize:"0.75rem",fontFamily:"'JetBrains Mono',monospace"}}>No market available yet for this race.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {polyOdds.map((driver, i) => (
                  <div key={driver.name} className="flex items-center gap-2">
                    <div style={{
                      fontFamily:"'JetBrains Mono',monospace",
                      fontSize:"0.7rem",
                      color: i === 0 ? '#FFD060' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : '#555',
                      width: '80px',
                      flexShrink: 0
                    }}>
                      {driver.name}
                    </div>
                    <div className="flex-1 relative" style={{height:'6px',background:'#111118',borderRadius:'3px'}}>
                      <div style={{
                        width: `${Math.round(driver.probability * 100)}%`,
                        height: '100%',
                        borderRadius: '3px',
                        background: i === 0 ? '#E8002D' : i === 1 ? '#4e6bff' : '#2a2a4a',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{
                      fontFamily:"'Bebas Neue',sans-serif",
                      fontSize:"0.85rem",
                      color: i === 0 ? '#FFD060' : '#555',
                      width:'36px',
                      textAlign:'right',
                      flexShrink:0
                    }}>
                      {Math.round(driver.probability * 100)}%
                    </div>
                  </div>
                ))}
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
