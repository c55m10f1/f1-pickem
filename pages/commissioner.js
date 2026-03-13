import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { Card, Label, Btn, Toast, Spinner } from '../components/ui'
import { supabase } from '../lib/supabase'
import { RACES, DRIVERS } from '../lib/data'

export default function Commissioner({ session, player, loading }) {
  const router = useRouter()
  const [results, setResults] = useState({})
  const [locks, setLocks] = useState([])
  const [picks, setPicks] = useState([])
  const [players, setPlayers] = useState([])
  const [inputs, setInputs] = useState({})
  const [fetching, setFetching] = useState({})
  const [toast, setToast] = useState(null)
  const [section, setSection] = useState('results')
  const [weekRace, setWeekRace] = useState(RACES[0].id)
  const [bulkText, setBulkText] = useState('')
  const [overridePlayer, setOverridePlayer] = useState('')
  const [overrideRace, setOverrideRace] = useState(RACES[0].id)
  const [op1, setOp1] = useState(''); const [op2, setOp2] = useState(''); const [op3, setOp3] = useState('')

  // SMS state
  const [smsPlayers, setSmsPlayers] = useState({})
  const [smsSending, setSmsSending] = useState({})
  const [smsMessage, setSmsMessage] = useState('')
  const [smsType, setSmsType] = useState('24hr')

  useEffect(() => {
    if (!loading && (!session || (player && !player.is_commissioner))) router.push('/')
  }, [loading, session, player])

  useEffect(() => { if (player?.is_commissioner) loadAll() }, [player])

  async function loadAll() {
    const [{ data: rs }, { data: lks }, { data: pks }, { data: ps }] = await Promise.all([
      supabase.from('race_results').select('*'),
      supabase.from('race_locks').select('*'),
      supabase.from('picks').select('*'),
      supabase.from('players').select('*'),
    ])
    const rMap = {}
    ;(rs || []).forEach(r => { rMap[r.race_id] = r })
    setResults(rMap)
    setLocks(lks || [])
    setPicks(pks || [])
    setPlayers(ps || [])
    const initInputs = {}
    RACES.forEach(r => { initInputs[r.id] = rMap[r.id] ? { p1: rMap[r.id].p1, p2: rMap[r.id].p2, p3: rMap[r.id].p3 } : { p1: '', p2: '', p3: '' } })
    setInputs(initInputs)
    if (ps?.length) setOverridePlayer(ps[0].id)
  }

  const showToast = (msg, type = 'ok') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3400) }

  const setField = (raceId, field, val) => setInputs(p => ({ ...p, [raceId]: { ...p[raceId], [field]: val } }))

  const saveResult = async (raceId) => {
    const { p1, p2, p3 } = inputs[raceId]
    if (!p1 || !p2 || !p3) return showToast('Fill all 3 positions', 'err')
    const { error } = await supabase.from('race_results').upsert({ race_id: raceId, p1, p2, p3 }, { onConflict: 'race_id' })
    if (error) return showToast('Error saving', 'err')
    showToast(`✅ ${RACES.find(r => r.id === raceId).name} saved!`)
    await loadAll()
  }

  const clearResult = async (raceId) => {
    await supabase.from('race_results').delete().eq('race_id', raceId)
    showToast(`Cleared ${RACES.find(r => r.id === raceId).name}`)
    await loadAll()
  }

  const lockRace = async (raceId) => {
    await supabase.from('race_locks').upsert({ race_id: raceId, locked_at: new Date().toISOString() }, { onConflict: 'race_id' })
    try {
      const res = await fetch('/api/autopick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ race_id: raceId })
      })
      const data = await res.json()
      const raceName = RACES.find(r => r.id === raceId).name
      if (data.autopicked?.length || data.dns?.length) {
        const msgs = []
        if (data.autopicked?.length) msgs.push(`🎲 Autopicked: ${data.autopicked.map(p => p.name).join(', ')}`)
        if (data.dns?.length) msgs.push(`❌ DNS (no picks left): ${data.dns.join(', ')}`)
        showToast(`🔒 ${raceName} locked! ${msgs.join(' · ')}`)
      } else {
        showToast(`🔒 ${raceName} locked! All players had picks.`)
      }
    } catch {
      showToast(`🔒 ${RACES.find(r => r.id === raceId).name} locked!`)
    }
    await loadAll()
  }

  const unlockRace = async (raceId) => {
    await supabase.from('race_locks').delete().eq('race_id', raceId)
    showToast(`🔓 ${RACES.find(r => r.id === raceId).name} unlocked`)
    await loadAll()
  }

  const aiFetch = async (raceId) => {
    const race = RACES.find(r => r.id === raceId)
    setFetching(f => ({ ...f, [raceId]: true }))
    try {
      const res = await fetch('/api/fetch-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raceName: race.name })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setInputs(p => ({ ...p, [raceId]: { p1: data.p1, p2: data.p2, p3: data.p3 } }))
      await supabase.from('race_results').upsert({ race_id: raceId, p1: data.p1, p2: data.p2, p3: data.p3 }, { onConflict: 'race_id' })
      showToast(`🤖 ${race.name}: ${data.p1} / ${data.p2} / ${data.p3}`)
      await loadAll()
    } catch (e) {
      showToast(`AI fetch failed: ${e.message}`, 'err')
    }
    setFetching(f => ({ ...f, [raceId]: false }))
  }

  const bulkImport = async () => {
    const lines = bulkText.trim().split('\n').filter(Boolean)
    let count = 0, errs = []
    for (const [i, line] of lines.entries()) {
      const parts = line.split(',').map(s => s.trim())
      if (parts.length < 5) { errs.push(`Line ${i + 1}: needs 5 fields`); continue }
      const [playerName, raceName, d1, d2, d3] = parts
      const race = RACES.find(r => r.name.toLowerCase().includes(raceName.toLowerCase()) || r.id === raceName.toUpperCase())
      const p = players.find(p => p.name.toLowerCase() === playerName.toLowerCase())
      if (!race) { errs.push(`Line ${i + 1}: unknown race "${raceName}"`); continue }
      if (!p) { errs.push(`Line ${i + 1}: unknown player "${playerName}"`); continue }
      await supabase.from('picks').upsert({ player_id: p.id, race_id: race.id, p1: d1, p2: d2, p3: d3, dns: false, updated_at: new Date().toISOString() }, { onConflict: 'player_id,race_id' })
      count++
    }
    setBulkText('')
    errs.length ? showToast(`${count} imported. ${errs[0]}`, 'err') : showToast(`✅ Imported ${count} picks!`)
    await loadAll()
  }

  const saveOverride = async () => {
    if (!op1 || !op2 || !op3) return showToast('Fill all 3', 'err')
    if (new Set([op1, op2, op3]).size < 3) return showToast('Need 3 different drivers', 'err')
    await supabase.from('picks').upsert({ player_id: overridePlayer, race_id: overrideRace, p1: op1, p2: op2, p3: op3, dns: false, updated_at: new Date().toISOString() }, { onConflict: 'player_id,race_id' })
    showToast(`✅ Override saved`)
    await loadAll()
  }

  // SMS functions
  const toggleSmsPlayer = (id) => {
    setSmsPlayers(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const selectAllSms = () => {
    const allSelected = players.every(p => smsPlayers[p.id])
    const next = {}
    players.forEach(p => { next[p.id] = !allSelected })
    setSmsPlayers(next)
  }

  const sendSmsToPlayer = async (playerId) => {
    const p = players.find(pl => pl.id === playerId)
    if (!p?.phone) return showToast(`${p?.name || 'Player'} has no phone number`, 'err')
    setSmsSending(prev => ({ ...prev, [playerId]: true }))
    try {
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, message_type: smsType, custom_message: smsMessage || null })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      showToast(`📱 Sent to ${p.name}!`)
    } catch (e) {
      showToast(`Failed: ${e.message}`, 'err')
    }
    setSmsSending(prev => ({ ...prev, [playerId]: false }))
  }

  const sendSmsToSelected = async () => {
    const selected = players.filter(p => smsPlayers[p.id])
    if (selected.length === 0) return showToast('Select at least one player', 'err')
    let sentCount = 0, errCount = 0
    for (const p of selected) {
      if (!p.phone) { errCount++; continue }
      setSmsSending(prev => ({ ...prev, [p.id]: true }))
      try {
        const res = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player_id: p.id, message_type: smsType, custom_message: smsMessage || null })
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        sentCount++
      } catch { errCount++ }
      setSmsSending(prev => ({ ...prev, [p.id]: false }))
    }
    showToast(errCount ? `📱 Sent ${sentCount}, failed ${errCount}` : `📱 Sent to ${sentCount} players!`)
  }

  // Auto-select next open race for This Week view
  useEffect(() => {
    const open = RACES.find(r => !locks.find(l => l.race_id === r.id) && !results[r.id])
    if (open) setWeekRace(open.id)
  }, [locks, results])

  const subBtn = (s, lbl) => (
    <button onClick={() => setSection(s)}
      className="flex-1 rounded-md py-2 text-[13px] font-semibold transition-all"
      style={{ background: section === s ? '#1e1e2c' : 'transparent', color: section === s ? '#eef0f5' : '#aaa', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
      {lbl}
    </button>
  )

  if (loading || !player?.is_commissioner) return null

  // Find next race for SMS context
  const nextRace = RACES.find(r => !locks.find(l => l.race_id === r.id) && !results[r.id])

  return (
    <Layout session={session} player={player}>
      <div className="fade-up">
        <div className="mb-5">
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",letterSpacing:"3px"}}>COMMISSIONER</h1>
          <div className="text-sm text-[#aaa] mt-1">Manage results · lock races · override picks</div>
        </div>

        <div className="flex bg-[#111118] border border-[#1e1e2c] rounded-lg p-1 mb-5 gap-1">
          {subBtn('results', '🏁 Results')}
          {subBtn('week', '👀 This Week')}
          {subBtn('picks', '📝 Override')}
          {subBtn('sms', '📱 SMS')}
          {subBtn('players', '👤 Players')}
        </div>

        {/* RESULTS */}
        {section === 'results' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#111118] border border-[#1e1e2c] rounded-lg px-4 py-3 text-sm text-[#aaa] flex gap-2">
              <span>👇</span>
              <span>Hit <span className="text-[#E8002D] font-bold">🔓 LOCK</span> when qualifying starts. Click <span className="text-red-400 font-bold">🔒 LOCKED</span> to reopen.</span>
            </div>
            {RACES.map((r, i) => {
              const res = results[r.id]
              const inp = inputs[r.id] || { p1: '', p2: '', p3: '' }
              const locked = !!locks.find(l => l.race_id === r.id)
              const isFetching = fetching[r.id]
              return (
                <Card key={r.id} className={`!p-3 ${res ? '!border-green-950' : locked ? '!border-red-950' : ''}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.57rem",color:"#aaa"}}>R{i+1} · {r.date}  </span>
                      <span className="font-semibold">{r.name}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      {res && <button onClick={() => clearResult(r.id)} className="text-[#bbb] hover:text-[#888] text-sm" style={{background:'none',border:'none',cursor:'pointer'}}>✕</button>}
                      {res && <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.6rem",color:"#2ECC71"}}>✓</span>}
                      {locked
                        ? <button onClick={() => unlockRace(r.id)} className="font-mono text-[11px] px-2 py-1 rounded border cursor-pointer" style={{background:'#1a0808',borderColor:'#6a2020',color:'#cc6666',fontFamily:'inherit'}}>🔒 LOCKED</button>
                        : <button onClick={() => lockRace(r.id)} className="font-mono text-[11px] px-2 py-1 rounded border cursor-pointer transition-colors hover:border-red-600 hover:text-red-500" style={{background:'#0a0a12',borderColor:'#2e2e42',color:'#aaa',fontFamily:'inherit'}}>🔓 LOCK</button>
                      }
                      <Btn blue small onClick={() => aiFetch(r.id)} disabled={isFetching}>
                        {isFetching ? <Spinner /> : '🤖'} AI
                      </Btn>
                    </div>
                  </div>
                  <div className="grid gap-2 items-end" style={{gridTemplateColumns:'1fr 1fr 1fr auto'}}>
                    {[['1st', 'p1'], ['2nd', 'p2'], ['3rd', 'p3']].map(([lbl, field]) => (
                      <div key={field}>
                        <div style={{fontSize:"0.58rem",color:"#aaa",marginBottom:"3px",fontFamily:"'JetBrains Mono',monospace"}}>{lbl}</div>
                        <input list={`dl-${r.id}`} value={inp[field] || ''} onChange={e => setField(r.id, field, e.target.value)} placeholder="Driver" style={{fontSize:"0.82rem",padding:"6px 8px"}} />
                      </div>
                    ))}
                    <datalist id={`dl-${r.id}`}>{DRIVERS.map(d => <option key={d} value={d} />)}</datalist>
                    <Btn green style={{padding:'7px 10px',fontSize:'0.76rem'}} onClick={() => saveResult(r.id)}>SAVE</Btn>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* THIS WEEK'S PICKS */}
        {section === 'week' && (() => {
          const race = RACES.find(r => r.id === weekRace)
          const isLocked = !!locks.find(l => l.race_id === weekRace)
          const hasResult = !!results[weekRace]
          const submitted = players.map(p => {
            const pk = picks.find(pk => pk.player_id === p.id && pk.race_id === weekRace)
            return { player: p, pick: pk }
          })
          const doneCount = submitted.filter(s => s.pick && !s.pick.dns).length
          const missing = submitted.filter(s => !s.pick || s.pick.dns)
          return (
            <div>
              <Card className="mb-3">
                <div className="flex justify-between items-center mb-3">
                  <Label>SELECT RACE</Label>
                  <div style={{fontSize:'0.65rem',fontFamily:"'JetBrains Mono',monospace",color: isLocked ? '#E8002D' : hasResult ? '#5a9abf' : '#4a7a4a'}}>
                    {hasResult ? '✓ SCORED' : isLocked ? '🔒 LOCKED' : '⏳ OPEN'}
                  </div>
                </div>
                <select value={weekRace} onChange={e => setWeekRace(e.target.value)}>
                  {RACES.map(r => {
                    const lk = !!locks.find(l => l.race_id === r.id)
                    const res = !!results[r.id]
                    return <option key={r.id} value={r.id}>{r.name} — {r.date}{lk ? ' 🔒' : ''}{res ? ' ✓' : ''}</option>
                  })}
                </select>
              </Card>

              {/* Summary bar */}
              <Card className="mb-3">
                <div className="flex justify-between items-center">
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",letterSpacing:"2px"}}>
                    {doneCount}/{players.length}
                    <span style={{fontSize:"0.7rem",color:"#aaa",marginLeft:"8px",letterSpacing:"1px"}}>SUBMITTED</span>
                  </div>
                  {missing.length > 0 && !isLocked && (
                    <div style={{fontSize:"0.7rem",color:"#E8002D",fontFamily:"'JetBrains Mono',monospace"}}>
                      missing: {missing.map(s => s.player.name).join(', ')}
                    </div>
                  )}
                  {missing.length === 0 && (
                    <div style={{fontSize:"0.7rem",color:"#4a7a4a",fontFamily:"'JetBrains Mono',monospace"}}>✓ all in</div>
                  )}
                </div>
              </Card>

              {/* Per-player picks grid */}
              <div className="flex flex-col gap-2">
                {submitted.map(({ player: p, pick: pk }) => {
                  const hasSubmitted = pk && !pk.dns
                  return (
                    <Card key={p.id} style={{borderColor: hasSubmitted ? '#1e2e1e' : '#2e1e1e'}}>
                      <div className="flex items-center justify-between">
                        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",letterSpacing:"2px",
                          color: hasSubmitted ? '#eef0f5' : '#bbb'}}>
                          {p.name.toUpperCase()}
                        </div>
                        {!hasSubmitted && (
                          <div style={{fontSize:"0.65rem",color:"#E8002D",fontFamily:"'JetBrains Mono',monospace",
                            background:'#1a0808',border:'1px solid #2e1010',borderRadius:'4px',padding:'2px 8px'}}>
                            {pk?.dns ? 'DNS' : 'NOT SUBMITTED'}
                          </div>
                        )}
                      </div>
                      {hasSubmitted && (
                        <div className="flex gap-4 mt-2">
                          {[['🥇', pk.p1], ['🥈', pk.p2], ['🥉', pk.p3]].map(([medal, driver]) => (
                            <div key={medal} className="flex items-center gap-1">
                              <span style={{fontSize:'0.9rem'}}>{medal}</span>
                              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.75rem",
                                color:'#ccc',fontWeight:'600'}}>
                                {driver}
                              </span>
                            </div>
                          ))}
                          {pk.is_autopick && (
                            <span style={{fontSize:"0.6rem",color:"#FFD060",fontFamily:"'JetBrains Mono',monospace",
                              marginLeft:'auto',alignSelf:'center'}}>🎲 AUTO</span>
                          )}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* OVERRIDE PICKS */}
        {section === 'picks' && (
          <div>
            <Card className="mb-3">
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.82rem",letterSpacing:"2px",color:"#bbb",marginBottom:"8px"}}>BULK IMPORT</div>
              <div className="text-xs text-[#bbb] mb-2">
                Format: <code className="text-blue-300">Player, Race, 1st, 2nd, 3rd</code>
                <span className="text-red-500 ml-2">⚠ Bypasses lock</span>
              </div>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={5}
                placeholder={'Casey, Australia, Norris, Piastri, Russell\nMatt, China, Piastri, Norris, Leclerc'} />
              <div className="mt-2"><Btn blue onClick={bulkImport}>📥 IMPORT</Btn></div>
            </Card>
            <Card>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.82rem",letterSpacing:"2px",color:"#bbb",marginBottom:"12px"}}>SINGLE OVERRIDE</div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label>PLAYER</Label>
                  <select value={overridePlayer} onChange={e => setOverridePlayer(e.target.value)}>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <Label>RACE</Label>
                  <select value={overrideRace} onChange={e => setOverrideRace(e.target.value)}>
                    {RACES.map(r => <option key={r.id} value={r.id}>{r.name}{results[r.id] ? ' ✓' : ''}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[['1st', op1, setOp1, [op2, op3]], ['2nd', op2, setOp2, [op1, op3]], ['3rd', op3, setOp3, [op1, op2]]].map(([lbl, val, set, ex]) => (
                  <div key={lbl}>
                    <Label>{lbl}</Label>
                    <select value={val} onChange={e => set(e.target.value)}>
                      <option value="">—</option>
                      {DRIVERS.filter(d => !ex.includes(d)).map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <Btn red full onClick={saveOverride}>OVERRIDE PICKS</Btn>
            </Card>
          </div>
        )}

        {/* SMS REMINDERS */}
        {section === 'sms' && (
          <div>
            {/* Next race context */}
            <Card className="mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.82rem",letterSpacing:"2px",color:"#bbb",marginBottom:"4px"}}>NEXT RACE</div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.4rem",letterSpacing:"2px"}}>
                    {nextRace ? `${nextRace.flag} ${nextRace.name.toUpperCase()}` : 'NO UPCOMING RACE'}
                  </div>
                  {nextRace && (
                    <div style={{fontSize:"0.65rem",color:"#aaa",fontFamily:"'JetBrains Mono',monospace",marginTop:"2px"}}>
                      locks {new Date(nextRace.qualiLock).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })}
                    </div>
                  )}
                </div>
                {nextRace && (() => {
                  const hrs = Math.round((new Date(nextRace.qualiLock) - new Date()) / (1000 * 60 * 60))
                  return (
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.6rem",
                      color: hrs <= 2 ? '#E8002D' : hrs <= 24 ? '#FFD060' : '#aaa'}}>
                      {hrs}H
                      <div style={{fontSize:"0.55rem",letterSpacing:"1px",color:"#aaa",fontFamily:"'JetBrains Mono',monospace"}}>UNTIL LOCK</div>
                    </div>
                  )
                })()}
              </div>
            </Card>

            {/* Message type selector */}
            <Card className="mb-3">
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.82rem",letterSpacing:"2px",color:"#bbb",marginBottom:"10px"}}>MESSAGE TYPE</div>
              <div className="flex bg-[#111118] border border-[#1e1e2c] rounded-lg p-1 mb-4 gap-1">
                {[['24hr', '⏰ 24hr Reminder'], ['2hr', '🚨 2hr Urgent'], ['results', '🏁 Results'], ['custom', '✏️ Custom']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setSmsType(val)}
                    className="flex-1 rounded-md py-2 text-[11px] font-semibold transition-all"
                    style={{ background: smsType === val ? '#1e1e2c' : 'transparent', color: smsType === val ? '#eef0f5' : '#aaa', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.62rem",color:"#999",marginBottom:"6px"}}>PREVIEW</div>
              <div style={{
                background:'#111118',border:'1px solid #1e1e2c',borderRadius:'8px',padding:'12px',
                fontSize:'0.82rem',color:'#888',lineHeight:'1.5'
              }}>
                {smsType === '24hr' && `🏎️ F1 Pick'em: Picks lock in 24 hours for the ${nextRace?.name || '___'} GP! Make your selections now at f1-pickem-six.vercel.app`}
                {smsType === '2hr' && `🏎️ F1 Pick'em: Picks lock in 2 HOURS for the ${nextRace?.name || '___'} GP! Don't miss out — pick now at f1-pickem-six.vercel.app`}
                {smsType === 'results' && `🏁 F1 Pick'em: The ${nextRace?.name || '___'} GP results are in! See who nailed it — check the leaderboard at f1-pickem-six.vercel.app`}
                {smsType === 'custom' && (smsMessage || '(type your message below)')}
              </div>

              {smsType === 'custom' && (
                <div className="mt-3">
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.62rem",color:"#999",marginBottom:"6px"}}>CUSTOM MESSAGE</div>
                  <textarea value={smsMessage} onChange={e => setSmsMessage(e.target.value)} rows={3}
                    placeholder="Type your custom message here..."
                    style={{background:'#1a1a24',border:'1px solid #2e2e42',color:'#eef0f5',borderRadius:'6px',padding:'10px 12px',fontFamily:'inherit',fontSize:'0.85rem',width:'100%',outline:'none',resize:'vertical'}} />
                </div>
              )}
            </Card>

            {/* Player list with send buttons */}
            <Card className="mb-3">
              <div className="flex justify-between items-center mb-3">
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.82rem",letterSpacing:"2px",color:"#bbb"}}>SEND TO</div>
                <button onClick={selectAllSms}
                  style={{fontSize:"0.62rem",color:"#aaa",fontFamily:"'JetBrains Mono',monospace",
                    background:'none',border:'none',cursor:'pointer'}}>
                  {players.every(p => smsPlayers[p.id]) ? 'deselect all' : 'select all'}
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {players.map(p => {
                  const hasPick = nextRace ? picks.find(pk => pk.player_id === p.id && pk.race_id === nextRace.id && !pk.dns) : false
                  const hasPhone = !!p.phone
                  const isSelected = !!smsPlayers[p.id]
                  const isSending = !!smsSending[p.id]
                  return (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                      style={{background: isSelected ? '#1a1a24' : 'transparent', border: `1px solid ${isSelected ? '#2e2e42' : '#111118'}`, transition: 'all 0.15s'}}>
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleSmsPlayer(p.id)}
                          style={{
                            width:'20px',height:'20px',borderRadius:'4px',border:`1px solid ${isSelected ? '#E8002D' : '#2e2e42'}`,
                            background: isSelected ? '#E8002D' : 'transparent',cursor:'pointer',
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'12px',color:'#fff',flexShrink:0
                          }}>
                          {isSelected ? '✓' : ''}
                        </button>
                        <div>
                          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.95rem",letterSpacing:"2px",
                            color: hasPhone ? '#eef0f5' : '#bbb'}}>
                            {p.name.toUpperCase()}
                          </div>
                          <div style={{fontSize:"0.58rem",fontFamily:"'JetBrains Mono',monospace",color:"#aaa",marginTop:"1px"}}>
                            {hasPhone ? `${p.phone.slice(0,3)}•••${p.phone.slice(-4)}` : 'no phone'}
                            {nextRace && (hasPick
                              ? <span style={{color:'#4a7a4a',marginLeft:'8px'}}>✓ picked</span>
                              : <span style={{color:'#E8002D',marginLeft:'8px'}}>no pick</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => sendSmsToPlayer(p.id)} disabled={!hasPhone || isSending}
                        style={{
                          background: hasPhone ? '#1a0808' : '#111118',
                          border: `1px solid ${hasPhone ? '#E8002D' : '#1e1e2c'}`,
                          color: hasPhone ? '#E8002D' : '#aaa',
                          borderRadius:'6px',padding:'5px 12px',cursor: hasPhone ? 'pointer' : 'not-allowed',
                          fontFamily:"'JetBrains Mono',monospace",fontSize:"0.65rem",letterSpacing:"1px",
                          opacity: isSending ? 0.5 : 1
                        }}>
                        {isSending ? '...' : 'SEND'}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Send to all selected button */}
              <button onClick={sendSmsToSelected}
                className="w-full mt-4 rounded-lg py-3 font-bold text-sm transition-colors"
                style={{
                  background:'#E8002D',color:'#fff',border:'none',cursor:'pointer',
                  fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.95rem",letterSpacing:"2px",
                  opacity: Object.values(smsPlayers).some(v => v) ? 1 : 0.4
                }}>
                📱 SEND TO SELECTED ({players.filter(p => smsPlayers[p.id]).length})
              </button>
            </Card>

            {/* Help text */}
            <div style={{fontSize:"0.58rem",color:"#999",fontFamily:"'JetBrains Mono',monospace",textAlign:"center",marginTop:"8px"}}>
              automated reminders run at 24hr and 2hr before lock via cron
            </div>
          </div>
        )}

        {/* PLAYERS */}
        {section === 'players' && (
          <Card>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.82rem",letterSpacing:"2px",color:"#bbb",marginBottom:"12px"}}>REGISTERED PLAYERS</div>
            <div className="text-xs text-[#bbb] mb-4">Players register themselves via the Sign Up page. To make someone commissioner, update their record in the Supabase dashboard → Table Editor → players → set is_commissioner = true.</div>
            {players.map(p => (
              <div key={p.id} className="flex justify-between items-center py-3 border-b border-[#111118]">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.62rem",color:"#bbb",marginTop:"2px"}}>{p.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.7rem",letterSpacing:"1px",
                    color: (p.autopicks_used||0) >= 2 ? '#E8002D' : (p.autopicks_used||0) === 1 ? '#FFD060' : '#aaa'}}>
                    🎲 {2 - (p.autopicks_used||0)}/2 LEFT
                  </div>
                  {p.is_commissioner && (
                    <span className="text-[11px] font-mono text-[#E8002D] border border-[#E8002D33] rounded px-2 py-0.5">COMMISH</span>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
      <Toast toast={toast} />
    </Layout>
  )
}
