export function Btn({ children, onClick, red, ghost, green, blue, small, disabled, full, type = 'button', className = '' }) {
  const base = `inline-flex items-center justify-center gap-1.5 rounded-lg font-bold cursor-pointer transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${full ? 'w-full' : ''} ${small ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'} ${className}`
  const variant = red    ? 'bg-f1red text-white hover:bg-red-700'
    : green  ? 'bg-green-950 border border-green-800 text-green-400 hover:bg-green-900'
    : blue   ? 'bg-blue-950 border border-blue-800 text-blue-300 hover:bg-blue-900'
    : ghost  ? 'bg-transparent border border-[#2e2e42] text-[#888] hover:border-[#555] hover:text-[#bbb]'
    :          'bg-[#1e1e2c] border border-[#2e2e42] text-[#aaa] hover:border-[#555]'
  return (
    <button type={type} className={`${base} ${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-[#16161e] border border-[#1e1e2c] rounded-xl p-5 ${className}`}>
      {children}
    </div>
  )
}

export function Label({ children }) {
  return (
    <div className="text-[11px] text-[#555] tracking-widest mb-1.5 font-mono uppercase">
      {children}
    </div>
  )
}

export function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg text-sm font-medium text-center max-w-xs shadow-2xl fade-up border ${
      toast.type === 'err'
        ? 'bg-[#1a0608] border-[#cc1133] text-red-200'
        : 'bg-[#061a0e] border-[#1a7a38] text-green-200'
    }`}>
      {toast.msg}
    </div>
  )
}

export function Spinner() {
  return (
    <div className="w-4 h-4 border-2 border-[#2e2e42] border-t-blue-400 rounded-full"
      style={{ animation: 'spin 0.6s linear infinite' }} />
  )
}

export function Badge({ locked }) {
  return locked
    ? <span className="inline-flex items-center gap-1 bg-red-950 border border-red-900 rounded px-2 py-0.5 text-[11px] font-mono text-red-400">🔒 LOCKED</span>
    : <span className="inline-flex items-center gap-1 bg-green-950 border border-green-900 rounded px-2 py-0.5 text-[11px] font-mono text-green-500">● OPEN</span>
}
