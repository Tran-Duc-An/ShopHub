import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import Loader from '@/components/ui/Loader'

const QUICK_LINKS = [
  { to: '/orders',        icon: '📦', label: 'My Orders' },
  { to: '/cart',          icon: '🛒', label: 'My Cart' },
  { to: '/gift-profiles', icon: '🎁', label: 'Gift Profiles' },
  { to: '/ai-assistant',  icon: '🤖', label: 'AI Gift Assistant' },
]

const SELLER_LINK = { to: '/seller', icon: '📊', label: 'Seller Dashboard' }

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) return <Loader text="Loading profile..." />

  const links = user.role === 'seller'
    ? [QUICK_LINKS[0], QUICK_LINKS[1], SELLER_LINK, QUICK_LINKS[2], QUICK_LINKS[3]]
    : QUICK_LINKS

  return (
    <div className="animate-fade-up max-w-[680px] mx-auto px-4 py-10">
      {/* Profile card */}
      <div className="flex items-center gap-5 rounded-card2 border border-slate-200
                      bg-white p-7 shadow-auth mb-6 sm:flex-col sm:text-center">
        <div className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center
                        rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
                        text-[1.75rem] font-black text-white shadow-card">
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-[1.35rem] font-extrabold tracking-tight text-slate-900">
            {user.name}
          </h2>
          <p className="text-[0.88rem] text-slate-400">{user.email}</p>
          <div className="flex items-center gap-2 sm:justify-center mt-1">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wide
                          ${user.role === 'seller'
                            ? 'bg-violet-50 text-violet-600'
                            : 'bg-indigo-50 text-indigo-600'}`}
            >
              {user.role}
            </span>
            {user.created_at && (
              <span className="text-[0.75rem] text-slate-400">
                Member since {new Date(user.created_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="flex items-center gap-3 rounded-card border border-slate-200 bg-white
                       px-5 py-4 no-underline transition-all hover:-translate-y-0.5
                       hover:border-indigo-200 hover:shadow-card"
          >
            <span className="text-[1.5rem]">{l.icon}</span>
            <span className="text-[0.95rem] font-semibold text-slate-700">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}