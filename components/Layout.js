import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
export default function Layout({ children, player, session }) {
  const router = useRouter()
  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }
  const navLinks = [
    { href: '/',           label: '🏆 Board'    },
    { href: '/picks',      label: '📝 My Picks' },
    { href: '/results',    label: '📊 Results'  },
    { href: '/schedule',   label: '📅 Schedule' },
    ...(player?.is_commissioner ? [{ href: '/commissioner', label: '⚙ Commish' }] : []),
  ]
  return (
    <div className="min-h-screen bg-[#0d0d12] text-[#eef0f5]">
      {/* Header */}
      <header className="bg-[#111118] border-b border-[#1e1e2c] sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-0.5 h-8 bg-[#E8002D] rounded" />
            <span className="font-bebas text-2xl tracking-[3px]">
              F1 <span className="text-[#E8002D]">PICK'EM</span>
            </span>
            <span className="font-mono text-[10px] text-[#3a3a4a] mt-0.5">2026</span>
          </div>
          <div className="flex items-center gap-3">
            {player && (
              <span className="font-mono text-[11px] text-[#5a6abf] hidden sm:block">
                {player.name.toUpperCase()}
              </span>
            )}
            {session ? (
              <button onClick={signOut}
                className="border border-[#2e2e42] text-[#666] rounded-md px-3 py-1 text-xs font-mono hover:border-[#555] hover:text-[#aaa] transition-colors">
                SIGN OUT
              </button>
            ) : (
              <Link href="/login"
                className="border border-[#2e2e42] text-[#666] rounded-md px-3 py-1 text-xs font-mono hover:border-[#555] hover:text-[#aaa] transition-colors">
                SIGN IN
              </Link>
            )}
          </div>
        </div>
        {/* Tab nav */}
        <div className="max-w-3xl mx-auto px-2 flex overflow-x-auto">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href}
              className={`px-4 py-3 text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors ${
                router.pathname === href
                  ? 'border-[#E8002D] text-[#E8002D]'
                  : 'border-transparent text-[#555] hover:text-[#888]'
              }`}>
              {label}
            </Link>
          ))}
        </div>
      </header>
      {/* Page content */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-16">
        {children}
      </main>
    </div>
  )
}
