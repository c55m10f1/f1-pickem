import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)

  const handleReset = async () => {
    setErr(null); setMsg(null)
    if (!password) return setErr('Enter a new password')
    if (password.length < 6) return setErr('Password must be at least 6 characters')
    if (password !== confirm) return setErr('Passwords do not match')

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setErr(error.message)
    else {
      setMsg('Password updated! Redirecting to sign in...')
      setTimeout(() => router.push('/login'), 2000)
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
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:"0.65rem",color:"#aaa",letterSpacing:"2px"}}>
            RESET PASSWORD
          </div>
        </div>

        <div className="bg-[#16161e] border border-[#1e1e2c] rounded-xl p-6">
          <div className="space-y-4">
            <div>
              <div style={{fontSize:"0.68rem",color:"#aaa",letterSpacing:"1px",marginBottom:"6px",fontFamily:"'JetBrains Mono',monospace"}}>NEW PASSWORD</div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleReset()} />
            </div>
            <div>
              <div style={{fontSize:"0.68rem",color:"#aaa",letterSpacing:"1px",marginBottom:"6px",fontFamily:"'JetBrains Mono',monospace"}}>CONFIRM PASSWORD</div>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleReset()} />
            </div>

            {err && <div className="text-red-400 text-sm">{err}</div>}
            {msg && <div className="text-green-400 text-sm">{msg}</div>}

            <button onClick={handleReset} disabled={loading}
              className="w-full bg-[#E8002D] text-white rounded-lg py-3 font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 mt-2"
              style={{fontFamily:'inherit',cursor:'pointer',border:'none'}}>
              {loading ? 'Updating…' : 'UPDATE PASSWORD'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
