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
  const [bulkText, setBulkText] = useState('')
  const [overridePlayer, setOverridePlayer] = useState('')
  const [overrideRace, setOverrideRace] = useState(RACES[0].id)
  const [op1, setOp1] = useState(''); const [op2, setOp2] = useState(''); const [op3, setOp3] = useState('')

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
    showToast(`🔒 ${RACES.find(r => r.id === raceId).name} locked!`)
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

  const subBtn = (s, lbl) => (
    <button onClick={() => setSection(s)}
      className="flex-1 rounded-md py-2 text-[13px] font-semibold transition-all"
      style={{ background: section === s ? '#1e1e2c' : 'transparent', color: section === s ? '#eef0f5' : '#555', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
      {lbl}
    </button>
  )

  if (loading || !player?.is_commissioner) return null

  return (
    <Layout session={session} player={player}>
      <div className="fade-up">
        <div className="mb-5">
          <h1 style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",letterSpacing:"3px"}}>COMMISSIONER</h1>
          <div className="text-sm text-[#555] mt-1">Manage results · lock races · override picks</div>
        </div>

        <div className="flex bg-[#111118] border border-[#1e1e2c] rounded-lg p-1 mb-5 gap-1">
          {subBtn('results', '🏁 Results')}
          {subBtn('picks', '📝 Override')}
          {subBtn('players', '👤 Players')}
        </div>

        {/* RESULTS */}
        {section === 'results' && (
          <div className="flex flex-col gap-3">
            <div className="bg-[#111118] border border-[#1e1e2c] rounded-lg px-4 py-3 text-sm text-[#555] flex gap-2">
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
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.57rem",color:"#333"}}>R{i+1} · {r.date}  </span>
                      <span className="font-semibold">{r.name}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      {res && <button onClick={() => clearResult(r.id)} className="text-[#444] hover:text-[#888] text-sm" style={{background:'none',border:'none',cursor:'pointer'}}>✕</button>}
                      {res && <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.6rem",color:"#2ECC71"}}>✓</span>}
                      {locked
                        ? <button onClick={() => unlockRace(r.id)} className="font-mono text-[11px] px-2 py-1 rounded border cursor-pointer" style={{background:'#1a0808',borderColor:'#6a2020',color:'#cc6666',fontFamily:'inherit'}}>🔒 LOCKED</button>
                        : <button onClick={() => lockRace(r.id)} className="font-mono text-[11px] px-2 py-1 rounded border cursor-pointer transition-colors hover:border-red-600 hover:text-red-500" style={{background:'#0a0a12',borderColor:'#2e2e42',color:'#555',fontFamily:'inherit'}}>🔓 LOCK</button>
                      }
                      <Btn blue small onClick={() => aiFetch(r.id)} disabled={isFetching}>
                        {isFetching ? <Spinner /> : '🤖'} AI
                      </Btn>
                    </div>
                  </div>
                  <div className="grid gap-2 items-end" style={{gridTemplateColumns:'1fr 1fr 1fr auto'}}>
                    {[['1st', 'p1'], ['2nd', 'p2'], ['3rd', 'p3']].map(([lbl, field]) => (
                      <div key={field}>
                        <div style={{fontSize:"0.58rem",color:"#333",marginBottom:"3px",fontFamily:"'JetBrains Mono',monospace"}}>{lbl}</div>
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

        {/* OVERRIDE PICKS */}
        {section === 'picks' && (
          <div>
            <Card className="mb-3">
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.82rem",letterSpacing:"2px",color:"#444",marginBottom:"8px"}}>BULK IMPORT</div>
              <div className="text-xs text-[#444] mb-2">
                Format: <code className="text-blue-300">Player, Race, 1st, 2nd, 3rd</code>
                <span className="text-red-500 ml-2">⚠ Bypasses lock</span>
              </div>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={5}
                placeholder={'Casey, Australia, Norris, Piastri, Russell\nMatt, China, Piastri, Norris, Leclerc'} />
              <div className="mt-2"><Btn blue onClick={bulkImport}>📥 IMPORT</Btn></div>
            </Card>
            <Card>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.82rem",letterSpacing:"2px",color:"#444",marginBottom:"12px"}}>SINGLE OVERRIDE</div>
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

        {/* PLAYERS */}
        {section === 'players' && (
          <Card>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"0.82rem",letterSpacing:"2px",color:"#444",marginBottom:"12px"}}>REGISTERED PLAYERS</div>
            <div className="text-xs text-[#444] mb-4">Players register themselves via the Sign Up page. To make someone commissioner, update their record in the Supabase dashboard → Table Editor → players → set is_commissioner = true.</div>
            {players.map(p => (
              <div key={p.id} className="flex justify-between items-center py-3 border-b border-[#111118]">
                <div>
                  <div className="font-semibold">{p.name}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.62rem",color:"#444",marginTop:"2px"}}>{p.email}</div>
                </div>
                {p.is_commissioner && (
                  <span className="text-[11px] font-mono text-[#E8002D] border border-[#E8002D33] rounded px-2 py-0.5">COMMISH</span>
                )}
              </div>
            ))}
          </Card>
        )}
      </div>
      <Toast toast={toast} />
    </Layout>
  )
}
