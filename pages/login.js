import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { Btn } from '../components/ui'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  const handle = async () => {
    setLoading(true); setErr(null); setMsg(null)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErr(error.message)
      else router.push('/')
    } else {
      if (!name.trim()) { setErr('Enter your name'); setLoading(false); return }
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setErr(error.message) }
      else if (data.user) {
        await fetch('/api/create-player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: data.user.id, email, name: name.trim() })
        })
        setMsg('Account created! You can now sign in.')
        setMode('login')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center px-4">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        *{box-sizing:border-box;} body{background:#0d0d12;color:#eef0f5;font-family:'DM Sans',sans-serif;}
        input{background:#1a1a24;border:1px solid #2e2e42;color:#eef0f5;border-radius:6px;padding:10px 12px;font-family:inherit;font-size:0.9rem;width:100%;outline:none;}
        input:focus{border-color:#E8002D;}
      `}</style>
      <div className="w-full max-w-sm fade-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-0.5 h-8 bg-[#E8002D] rounded" />
            <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"2rem",letterSpacing:"3px"}}>
              F1 <span style={{color:"#E8002D"}}>PICK'EM</span>
            </span>
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.65rem",color:"#3a3a4a",letterSpacing:"2px"}}>
            2026 SEASON
          </div>
        </div>

        <div className="bg-[#16161e] border border-[#1e1e2c] rounded-xl p-6">
          {/* Toggle */}
          <div className="flex bg-[#111118] border border-[#1e1e2c] rounded-lg p-1 mb-6 gap-1">
            {[['login','Sign In'],['signup','Create Account']].map(([m,lbl])=>(
              <button key={m} onClick={()=>{setMode(m);setErr(null);setMsg(null)}}
                className="flex-1 rounded-md py-2 text-sm font-semibold transition-all"
                style={{background:mode===m?'#1e1e2c':'transparent',color:mode===m?'#eef0f5':'#555',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                {lbl}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === 'signup' && (
              <div>
                <div style={{fontSize:"0.68rem",color:"#555",letterSpacing:"1px",marginBottom:"6px",fontFamily:"'JetBrains Mono',monospace"}}>YOUR NAME</div>
                <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Name" />
              </div>
            )}
            <div>
              <div style={{fontSize:"0.68rem",color:"#555",letterSpacing:"1px",marginBottom:"6px",fontFamily:"'JetBrains Mono',monospace"}}>EMAIL</div>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="you@email.com" onKeyDown={e=>e.key==='Enter'&&handle()}/>
            </div>
            <div>
              <div style={{fontSize:"0.68rem",color:"#555",letterSpacing:"1px",marginBottom:"6px",fontFamily:"'JetBrains Mono',monospace"}}>PASSWORD</div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&handle()}/>
            </div>

            {err && <div className="text-red-400 text-sm">{err}</div>}
            {msg && <div className="text-green-400 text-sm">{msg}</div>}

            <button onClick={handle} disabled={loading}
              className="w-full bg-[#E8002D] text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 mt-2"
              style={{fontFamily:'inherit',cursor:'pointer',border:'none'}}>
              {loading ? 'Loading…' : mode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </div>

          {mode === 'login' && (
            <div className="mt-4 text-center text-xs text-[#444]">
              Don't have an account?{' '}
              <button onClick={()=>setMode('signup')} className="text-[#7ec8f0] hover:underline" style={{background:'none',border:'none',cursor:'pointer',fontFamily:'inherit',fontSize:'inherit'}}>
                Sign up
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.58rem",color:"#2a2a3a",letterSpacing:"1px"}}>
          <a href="/privacy-policy.html" style={{color:"#2a2a3a",textDecoration:"none",borderBottom:"1px solid transparent",transition:"all 0.2s"}}
            onMouseOver={e=>e.target.style.color="#555"} onMouseOut={e=>e.target.style.color="#2a2a3a"}>privacy</a>
          <span style={{margin:"0 8px"}}>·</span>
          <a href="/terms-and-conditions.html" style={{color:"#2a2a3a",textDecoration:"none",borderBottom:"1px solid transparent",transition:"all 0.2s"}}
            onMouseOver={e=>e.target.style.color="#555"} onMouseOut={e=>e.target.style.color="#2a2a3a"}>terms</a>
        </div>
      </div>
    </div>
  )
}
