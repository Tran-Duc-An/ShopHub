import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { to: '/',              label: 'Home' },
  { to: '/products',      label: 'Products' },
  { to: '/gift-profiles', label: '🎁 Gifts',        auth: true },
  { to: '/ai-assistant',  label: '🤖 AI Assistant', auth: true },
  { to: '/cart',          label: '🛒 Cart',          auth: true },
  { to: '/orders',        label: 'Orders',           auth: true },
  { to: '/profile',       label: 'Profile',          auth: true },
  { to: '/seller',        label: 'Dashboard',        seller: true },
]

export default function Navbar() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const visibleLinks = NAV_LINKS.filter((l) => {
    if (l.seller) return user?.role === 'seller'
    if (l.auth)   return !!token
    return true
  })

  return (
    <nav className="sticky top-0 z-50 flex h-[60px] items-center justify-between
                    border-b border-black/[0.06] bg-white/[0.92] px-[clamp(1rem,3vw,2.5rem)]
                    backdrop-blur-xl backdrop-saturate-180">
      {/* Brand */}
      <Link
        to="/"
        className="text-brand-gradient text-[1.35rem] font-black tracking-tight no-underline"
      >
        ShopHub
      </Link>

      {/* ── Desktop links (hidden on mobile, flex on md+) ── */}
      <div className="hidden items-center gap-0.5 md:flex">
        {visibleLinks.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="rounded-lg px-[0.85rem] py-[0.45rem] text-[0.85rem] font-medium
                       text-slate-600 no-underline transition-all
                       hover:bg-indigo-50 hover:text-indigo-600"
          >
            {l.label}
          </Link>
        ))}

        {token ? (
          <Button
            variant="outline"
            size="sm"
            className="ml-1 text-slate-500 hover:border-red-300 hover:bg-red-50 hover:text-red-500"
            onClick={handleLogout}
          >
            Logout
          </Button>
        ) : (
          <Link
            to="/login"
            className="ml-1 rounded-lg bg-indigo-600 px-4 py-[0.45rem] text-[0.85rem]
                       font-semibold text-white no-underline transition-all hover:bg-indigo-700"
          >
            Login
          </Link>
        )}
      </div>

      {/* ── Hamburger button (visible on mobile, hidden on md+) ── */}
      <button
        className="flex flex-col gap-[5px] rounded-md p-1.5 md:hidden"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <span className={cn(
          'block h-0.5 w-[22px] rounded bg-slate-700 transition-all duration-300',
          menuOpen && 'translate-y-[7px] rotate-45',
        )} />
        <span className={cn(
          'block h-0.5 w-[22px] rounded bg-slate-700 transition-all duration-300',
          menuOpen && 'opacity-0',
        )} />
        <span className={cn(
          'block h-0.5 w-[22px] rounded bg-slate-700 transition-all duration-300',
          menuOpen && '-translate-y-[7px] -rotate-45',
        )} />
      </button>

      {/* ── Mobile menu overlay (visible on mobile only) ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 top-[60px] z-40 flex flex-col gap-0.5
                     overflow-y-auto bg-white/[0.98] p-4 backdrop-blur-xl md:hidden"
        >
          {visibleLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className="rounded-[10px] px-4 py-3 text-[0.95rem] font-medium
                         text-slate-700 no-underline hover:bg-indigo-50 hover:text-indigo-600"
            >
              {l.label}
            </Link>
          ))}

          {token ? (
            <button
              onClick={handleLogout}
              className="mt-1 rounded-[10px] border border-slate-200 px-4 py-3
                         text-center text-[0.95rem] font-semibold text-slate-500
                         hover:border-red-300 hover:bg-red-50 hover:text-red-500"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-1 rounded-[10px] bg-indigo-600 px-4 py-3 text-center
                         text-[0.95rem] font-semibold text-white no-underline hover:bg-indigo-700"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}