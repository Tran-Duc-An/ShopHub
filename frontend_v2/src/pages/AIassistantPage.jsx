import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSearchParams, Link } from 'react-router-dom'
import { aiApi, giftProfilesApi, proxyImage } from '@/lib/api'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/use-toast'
import { OCCASIONS, RELATIONSHIP_EMOJIS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// ─── Render bold markdown in chat bubbles ─────────────────
function RichText({ content }) {
  return (
    <div className="flex flex-col gap-1">
      {content.split('\n').map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g)
        return (
          <p key={i} className="text-[0.88rem] leading-relaxed">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </p>
        )
      })}
    </div>
  )
}

// ─── Product card inside chat ──────────────────────────────
function ChatProductCard({ product, onAddToCart }) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-indigo-100
                    bg-indigo-50/60 p-3 transition-all hover:border-indigo-200">
      <Link
        to={`/products/${product.product_id}`}
        className="flex h-[56px] w-[56px] flex-shrink-0 items-center justify-center
                   rounded-xl bg-white"
      >
        <img
          src={proxyImage(product.image_url)}
          alt={product.product_name}
          className="max-h-[46px] max-w-[46px] object-contain"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </Link>
      <div className="flex flex-1 flex-col gap-0.5 min-w-0">
        <Link
          to={`/products/${product.product_id}`}
          className="text-[0.82rem] font-semibold text-slate-800 no-underline
                     hover:text-indigo-600 line-clamp-2"
        >
          {product.product_name}
        </Link>
        {product.brand && (
          <span className="text-[0.65rem] font-bold uppercase tracking-wide text-indigo-500">
            {product.brand}
          </span>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[0.9rem] font-extrabold text-slate-900">${product.final_price}</span>
          {product.rating && (
            <span className="text-[0.7rem] text-amber-500">⭐ {product.rating}</span>
          )}
        </div>
      </div>
      <button
        onClick={() => onAddToCart(product.product_id)}
        className="flex-shrink-0 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-[0.7rem]
                   font-bold text-white hover:bg-indigo-700"
      >
        + Cart
      </button>
    </div>
  )
}

// ─── Profile Drawer (slide-in panel) ──────────────────────
function ProfileDrawer({ open, onClose, profiles, selectedProfile, onSelect }) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div className={cn(
        'fixed left-0 top-0 z-50 flex h-full w-[300px] flex-col bg-white shadow-2xl',
        'transition-transform duration-300 ease-in-out',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-[0.95rem] font-bold text-slate-800">Gift Profiles</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full
                       text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Profile list */}
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-4">
          {profiles.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-4xl">🎁</span>
              <p className="text-[0.82rem] text-slate-400">No profiles yet</p>
              <Link to="/gift-profiles" onClick={onClose}>
                <Button size="sm" variant="outline" className="text-[0.75rem]">
                  Create a Profile
                </Button>
              </Link>
            </div>
          ) : (
            profiles.map((p) => (
              <button
                key={p.profile_id}
                onClick={() => { onSelect(p); onClose() }}
                className={cn(
                  'flex items-center gap-3 rounded-[12px] px-3 py-3 text-left transition-all',
                  selectedProfile?.profile_id === p.profile_id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'hover:bg-slate-50 text-slate-700'
                )}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center
                                 rounded-full bg-white/20 text-[1.1rem] shadow-sm">
                  {RELATIONSHIP_EMOJIS[p.relationship] || '🎁'}
                </span>
                <div>
                  <p className="text-[0.85rem] font-semibold leading-tight">{p.name}</p>
                  <p className={cn('text-[0.7rem] capitalize mt-0.5',
                    selectedProfile?.profile_id === p.profile_id
                      ? 'text-indigo-200' : 'text-slate-400')}>
                    {p.relationship}
                  </p>
                </div>
                {selectedProfile?.profile_id === p.profile_id && (
                  <svg className="ml-auto" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer CTA */}
        {profiles.length > 0 && (
          <div className="border-t border-slate-100 p-4">
            <Link to="/gift-profiles" onClick={onClose}>
              <Button size="sm" variant="outline" className="w-full text-[0.78rem]">
                + Manage Profiles
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Main Page ─────────────────────────────────────────────
export default function AIAssistantPage() {
  const { token } = useAuth()
  const [searchParams] = useSearchParams()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [profiles, setProfiles]               = useState([])
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [messages, setMessages]               = useState([])
  const [input, setInput]                     = useState('')
  const [sending, setSending]                 = useState(false)
  const [drawerOpen, setDrawerOpen]           = useState(false)
  const chatEndRef  = useRef(null)
  const textareaRef = useRef(null)

  // Load profiles + handle ?profile= param
  useEffect(() => {
    giftProfilesApi.getAll(token).then((data) => {
      const list = data.data || []
      setProfiles(list)

      const paramId = searchParams.get('profile')
      const found = paramId ? list.find((p) => p.profile_id === paramId) : null

      if (found) {
        setSelectedProfile(found)
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm ready to help you find the perfect gift for **${found.name}** (your ${found.relationship}). What occasion are you shopping for?`,
        }])
      } else {
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm your AI gift assistant 🎁\n\nSelect a gift profile to get personalised suggestions, or just tell me about the person and occasion — I'm here to help!`,
        }])
      }
    }).catch(() => {})
  }, [token])

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const appendMessages = (newMsgs) =>
    setMessages((prev) => [...prev, ...newMsgs])

  const switchProfile = (p) => {
    setSelectedProfile(p)
    appendMessages([{
      role: 'assistant',
      content: `Switched to **${p.name}** (${p.relationship}). What occasion are you shopping for?`,
    }])
  }

  const sendMessage = async (text) => {
    if (!text.trim() || sending) return
    appendMessages([{ role: 'user', content: text }])
    setInput('')
    setSending(true)
    try {
      const data = await aiApi.chat(token, {
        message: text,
        profile_id: selectedProfile?.profile_id,
      })
      const newMsgs = [{ role: 'assistant', content: data.reply }]
      data.recommended_products?.forEach((p) => newMsgs.push({ role: 'product', product: p }))
      appendMessages(newMsgs)
    } catch (err) {
      appendMessages([{ role: 'assistant', content: `Sorry, something went wrong: ${err.message}` }])
    } finally {
      setSending(false)
    }
  }

  const handleSuggest = async (occasion) => {
    if (!selectedProfile || sending) return
    appendMessages([{ role: 'user', content: `Suggest gifts for ${selectedProfile.name} for ${occasion}` }])
    setSending(true)
    try {
      const data = await aiApi.suggest(token, {
        profile_id: selectedProfile.profile_id,
        occasion,
      })
      const newMsgs = [{ role: 'assistant', content: data.reply }]
      data.recommended_products?.forEach((p) => newMsgs.push({ role: 'product', product: p }))
      appendMessages(newMsgs)
    } catch (err) {
      appendMessages([{ role: 'assistant', content: `Sorry, something went wrong: ${err.message}` }])
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleAddToCart = async (productId) => {
    try {
      await addItem(productId)
      toast({ title: 'Added to cart!' })
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' })
    }
  }

  return (
    <>
      {/* Profile slide-in drawer */}
      <ProfileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        profiles={profiles}
        selectedProfile={selectedProfile}
        onSelect={switchProfile}
      />

      {/*
        Full-height chat shell.
        We undo the page's default padding with negative margins so the
        chat can own the entire viewport below the navbar.
      */}
      <div className="flex h-[calc(100vh-60px)] flex-col overflow-hidden
                      -mx-[clamp(1rem,3vw,2.5rem)] -mt-6 bg-slate-50">

        {/* ── Chat header bar ──────────────────────────────── */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-slate-200
                        bg-white px-4 py-3 shadow-sm">

          {/* Hamburger / profiles toggle */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl
                       border border-slate-200 bg-slate-50 text-slate-600
                       transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
            aria-label="Open profiles"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6"  x2="21" y2="6"  />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Bot identity */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full
                            bg-indigo-600 text-[1rem] shadow-sm">
              🤖
            </div>
            <div>
              <p className="text-[0.88rem] font-bold text-slate-800 leading-tight">AI Gift Assistant</p>
              <p className="text-[0.68rem] text-emerald-500 font-semibold flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Online
              </p>
            </div>
          </div>

          {/* Active profile chip */}
          {selectedProfile && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="ml-auto flex items-center gap-2 rounded-full border border-indigo-200
                         bg-indigo-50 py-1 pl-2 pr-3 transition-all hover:border-indigo-400
                         hover:bg-indigo-100"
            >
              <span className="text-[0.9rem]">
                {RELATIONSHIP_EMOJIS[selectedProfile.relationship] || '🎁'}
              </span>
              <span className="text-[0.75rem] font-semibold text-indigo-700">
                {selectedProfile.name}
              </span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                strokeLinejoin="round" className="text-indigo-400">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}

          {/* No profile — pick one CTA */}
          {!selectedProfile && (
            <button
              onClick={() => setDrawerOpen(true)}
              className="ml-auto rounded-full border border-dashed border-slate-300 px-3 py-1
                         text-[0.75rem] font-semibold text-slate-400 transition-all
                         hover:border-indigo-300 hover:text-indigo-500"
            >
              + Select a profile
            </button>
          )}
        </div>

        {/* ── Messages ─────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 scrollbar-thin
                        sm:px-[clamp(1rem,8vw,6rem)]">
          {messages.map((msg, i) => {
            if (msg.role === 'product') {
              return (
                <div key={i} className="flex gap-2 max-w-[520px]">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center
                                  rounded-full bg-indigo-100 text-[0.9rem]">
                    🛍️
                  </div>
                  <ChatProductCard product={msg.product} onAddToCart={handleAddToCart} />
                </div>
              )
            }

            return (
              <div
                key={i}
                className={cn(
                  'flex gap-2.5 max-w-[78%]',
                  msg.role === 'user' && 'ml-auto flex-row-reverse'
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[0.85rem] shadow-sm',
                  msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200'
                )}>
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>

                {/* Bubble */}
                <div className={cn(
                  'rounded-2xl px-4 py-3 shadow-sm',
                  msg.role === 'user'
                    ? 'rounded-tr-sm bg-indigo-600 text-white'
                    : 'rounded-tl-sm bg-white border border-slate-200 text-slate-700'
                )}>
                  <RichText content={msg.content} />
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {sending && (
            <div className="flex gap-2.5 max-w-[78%]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full
                              border border-slate-200 bg-white text-[0.85rem] shadow-sm">
                🤖
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border
                              border-slate-200 bg-white px-4 py-3 shadow-sm">
                {[0, 160, 320].map((delay) => (
                  <span
                    key={delay}
                    className="h-2 w-2 rounded-full bg-slate-300 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* ── Occasion chips (shown above input when profile selected) ── */}
        {selectedProfile && (
          <div className="flex flex-shrink-0 items-center gap-2 overflow-x-auto border-t
                          border-slate-100 bg-white px-4 py-2.5 scrollbar-none">
            <span className="flex-shrink-0 text-[0.68rem] font-bold uppercase tracking-widest text-slate-400">
              Quick:
            </span>
            {OCCASIONS.map((o) => (
              <button
                key={o}
                onClick={() => handleSuggest(o)}
                disabled={sending}
                className="flex-shrink-0 rounded-full border border-slate-200 bg-slate-50
                           px-3 py-1 text-[0.72rem] font-semibold text-slate-600 transition-all
                           hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600
                           disabled:opacity-40"
              >
                {o}
              </button>
            ))}
          </div>
        )}

        {/* ── Input bar ────────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-slate-200 bg-white px-4 py-3
                        sm:px-[clamp(1rem,8vw,6rem)]">
          <div className="flex items-end gap-2.5 rounded-2xl border-[1.5px] border-slate-200
                          bg-slate-50 px-4 py-3 transition-all
                          focus-within:border-indigo-400 focus-within:ring-[3px]
                          focus-within:ring-indigo-100">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                // auto-grow
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder={selectedProfile
                ? `Ask about gifts for ${selectedProfile.name}…`
                : 'Ask me about gift ideas…'}
              rows={1}
              disabled={sending}
              className="flex-1 resize-none bg-transparent text-[0.9rem] text-slate-800
                         outline-none placeholder:text-slate-400 scrollbar-thin leading-relaxed"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || sending}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl
                         bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700
                         disabled:bg-indigo-200 disabled:cursor-not-allowed"
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2
                                 border-white/30 border-t-white" />
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[0.66rem] text-slate-400">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </>
  )
}