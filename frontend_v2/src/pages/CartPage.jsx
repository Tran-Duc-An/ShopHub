import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/hooks/useCart'
import { useGiftProfiles } from '@/hooks/useGiftProfiles'
import { ordersApi, proxyImage } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { RELATIONSHIPS, RELATIONSHIP_EMOJIS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import Loader from '@/components/ui/Loader'
import EmptyState from '@/components/ui/EmptyState'

export default function CartPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { cart, items, loading, updateItem, removeItem, clearCart } = useCart()
  const { profiles } = useGiftProfiles()

  const [recipients, setRecipients] = useState({})
  const [placing, setPlacing] = useState(false)

  // Auto-fill from selectedGiftProfile in localStorage
  useEffect(() => {
    if (!items.length) return
    try {
      const profile = JSON.parse(localStorage.getItem('selectedGiftProfile') || 'null')
      if (!profile) return
      setRecipients((prev) => {
        const next = { ...prev }
        items.forEach((item) => {
          if (!next[item.product_id]) {
            next[item.product_id] = {
              recipient: profile.relationship,
              recipient_name: profile.name,
            }
          }
        })
        return next
      })
    } catch {}
  }, [items])

  const setRecipientField = (productId, field, value) =>
    setRecipients((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] || {}), [field]: value },
    }))

  const placeOrder = async () => {
    setPlacing(true)
    try {
      const data = await ordersApi.place(token, { recipients })
      navigate(`/orders/${data.data.order_id}`)
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' })
    } finally {
      setPlacing(false)
    }
  }

  if (loading) return <Loader text="Loading cart..." />

  return (
    <div className="animate-fade-up max-w-[900px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-[1.75rem] font-extrabold tracking-tight text-slate-900 md:text-[1.25rem]">
          Shopping Cart
        </h2>
        {items.length > 0 && (
          <span className="text-[0.82rem] text-slate-400">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Find something you love!"
          action={
            <Link to="/">
              <Button>Browse Products</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex gap-6 items-start lg:flex-col">
          {/* Items list */}
          <div className="flex flex-1 flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.cart_item_id}
                className="flex gap-4 rounded-card border border-slate-200 bg-white
                           p-4 transition-shadow hover:shadow-card sm:flex-col sm:gap-3"
              >
                {/* Image */}
                <Link
                  to={`/products/${item.product_id}`}
                  className="flex h-[90px] w-[90px] flex-shrink-0 items-center justify-center
                             rounded-xl bg-slate-50 sm:h-[70px] sm:w-[70px]"
                >
                  <img
                    src={proxyImage(item.image_url)}
                    alt={item.product_name}
                    className="max-h-[70px] max-w-[70px] object-contain"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </Link>

                {/* Details */}
                <div className="flex flex-1 flex-col gap-1.5">
                  <Link
                    to={`/products/${item.product_id}`}
                    className="text-[0.9rem] font-semibold leading-snug text-slate-800
                               no-underline hover:text-indigo-600"
                  >
                    {item.product_name}
                  </Link>
                  {item.brand && (
                    <span className="w-fit rounded bg-indigo-50 px-1.5 py-0.5 text-[0.65rem]
                                     font-bold uppercase tracking-wide text-indigo-700">
                      {item.brand}
                    </span>
                  )}
                  <span className="text-[1rem] font-extrabold text-slate-900">
                    ${item.final_price}
                  </span>

                  {/* Recipient */}
                  <div className="flex items-center gap-2 flex-wrap mt-1">
                    <span className="text-[0.75rem] font-semibold text-slate-500">Gift for:</span>
                    <select
                      value={recipients[item.product_id]?.recipient || ''}
                      onChange={(e) => setRecipientField(item.product_id, 'recipient', e.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1
                                 text-[0.78rem] outline-none focus:border-indigo-400"
                    >
                      <option value="">Select...</option>
                      {RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>
                          {RELATIONSHIP_EMOJIS[r]} {r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      list="recipient-names"
                      placeholder="Name (optional)"
                      value={recipients[item.product_id]?.recipient_name || ''}
                      onChange={(e) => setRecipientField(item.product_id, 'recipient_name', e.target.value)}
                      className="w-[130px] rounded-lg border border-slate-200 bg-slate-50 px-2 py-1
                                 text-[0.78rem] outline-none focus:border-indigo-400"
                    />
                    <datalist id="recipient-names">
                      {profiles.map((p) => (
                        <option key={p.profile_id} value={p.name} />
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end justify-between gap-2 sm:flex-row sm:items-center">
                  {/* Qty stepper */}
                  <div className="flex items-center rounded-[10px] border border-slate-200 overflow-hidden">
                    <button
                      onClick={() => item.quantity > 1 && updateItem(item.cart_item_id, item.quantity - 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50 disabled:opacity-30"
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="min-w-[28px] text-center text-[0.85rem] font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItem(item.cart_item_id, item.quantity + 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-[0.95rem] font-bold text-slate-800">
                    ${(item.final_price * item.quantity).toFixed(2)}
                  </span>

                  <button
                    onClick={() => removeItem(item.cart_item_id)}
                    className="text-[0.75rem] font-semibold text-slate-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="sticky top-[72px] w-[280px] rounded-card border border-slate-200
                          bg-white p-5 lg:static lg:w-full">
            <h3 className="mb-4 text-[1rem] font-bold text-slate-900">Order Summary</h3>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="text-slate-500">Total</span>
              <span className="text-[1.5rem] font-black text-slate-900">
                ${cart?.total?.toFixed(2)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={placeOrder}
                disabled={placing}
                className="w-full bg-indigo-600 font-bold hover:bg-indigo-700"
              >
                {placing ? 'Placing Order...' : 'Place Order'}
              </Button>
              <Button
                variant="outline"
                onClick={clearCart}
                className="w-full text-slate-500 hover:text-red-500 hover:border-red-300"
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}