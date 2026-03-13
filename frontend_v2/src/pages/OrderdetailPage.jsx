import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ordersApi, feedbackApi, proxyImage } from '@/lib/api'
import { ORDER_STATUS_STYLES } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import Loader from '@/components/ui/Loader'
import FeedbackForm from '@/components/ui/FeedbackForm'
import { cn } from '@/lib/utils'

export default function OrderDetailPage() {
  const { id } = useParams()
  const { token } = useAuth()
  const { toast } = useToast()

  const [order, setOrder]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [feedbacks, setFeedbacks] = useState({})
  const [cancelling, setCancelling] = useState(false)

  const fetchOrder = useCallback(() => {
    ordersApi.getById(token, id)
      .then((data) => setOrder(data.data))
      .catch(() => toast({ title: 'Failed to load order', variant: 'destructive' }))
      .finally(() => setLoading(false))
  }, [token, id])

  const fetchFeedbacks = useCallback(async () => {
    try {
      const data = await feedbackApi.getAll(token)
      const map = {}
      ;(data.data || []).forEach((fb) => {
        if (fb.product) map[fb.product._id || fb.product] = fb
      })
      setFeedbacks(map)
    } catch {}
  }, [token])

  useEffect(() => { fetchOrder() }, [fetchOrder])
  useEffect(() => { if (order) fetchFeedbacks() }, [order, fetchFeedbacks])

  const cancelOrder = async () => {
    setCancelling(true)
    try {
      await ordersApi.cancel(token, id)
      fetchOrder()
      toast({ title: 'Order cancelled' })
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' })
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <Loader text="Loading order..." />
  if (!order)  return (
    <div className="py-20 text-center text-slate-500">
      Order not found.{' '}
      <Link to="/orders" className="text-indigo-600 hover:underline">Back to orders</Link>
    </div>
  )

  return (
    <div className="animate-fade-up max-w-[820px] mx-auto px-4 py-6">
      <Link
        to="/orders"
        className="mb-4 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.875rem]
                   font-semibold text-indigo-600 no-underline hover:bg-indigo-50"
      >
        ← Orders
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <p className="text-[0.75rem] font-mono text-slate-400 mb-0.5">#{order.order_id}</p>
          <h2 className="text-[1.5rem] font-extrabold tracking-tight text-slate-900">
            Order Details
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-[0.72rem] font-bold uppercase tracking-wide',
              ORDER_STATUS_STYLES[order.status] || 'bg-slate-50 text-slate-500 border-slate-200'
            )}
          >
            {order.status}
          </span>
          {order.status === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={cancelOrder}
              disabled={cancelling}
              className="border-red-200 text-red-500 hover:bg-red-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}
        </div>
      </div>

      {/* Meta */}
      <div className="mb-5 flex gap-4 flex-wrap text-[0.85rem] text-slate-500">
        <span>📅 {new Date(order.created_at).toLocaleString()}</span>
        <span>💰 <strong className="text-slate-800">${order.total_amount.toFixed(2)}</strong></span>
      </div>

      {/* Items */}
      <h3 className="mb-3 text-[1rem] font-bold text-slate-700">
        Items ({order.items.length})
      </h3>
      <div className="flex flex-col gap-4">
        {order.items.map((item) => (
          <div
            key={item.order_item_id}
            className="rounded-card border border-slate-200 bg-white p-4"
          >
            <div className="flex gap-4 sm:flex-col sm:gap-3">
              {/* Image */}
              <Link
                to={`/products/${item.product_id}`}
                className="flex h-[80px] w-[80px] flex-shrink-0 items-center justify-center
                           rounded-xl bg-slate-50"
              >
                <img
                  src={proxyImage(item.image_url)}
                  alt={item.product_name}
                  className="max-h-[64px] max-w-[64px] object-contain"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </Link>

              {/* Details */}
              <div className="flex flex-1 items-start justify-between gap-2 sm:flex-col">
                <div>
                  <Link
                    to={`/products/${item.product_id}`}
                    className="text-[0.9rem] font-semibold text-slate-800 no-underline hover:text-indigo-600"
                  >
                    {item.product_name}
                  </Link>
                  {item.brand && (
                    <span className="ml-2 rounded bg-indigo-50 px-1.5 py-0.5 text-[0.65rem]
                                     font-bold uppercase tracking-wide text-indigo-700">
                      {item.brand}
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-0.5 text-[0.82rem] sm:items-start">
                  <span className="text-slate-500">Qty: {item.quantity}</span>
                  <span className="text-slate-500">${item.price_at_purchase.toFixed(2)} each</span>
                  <span className="font-bold text-slate-900">
                    ${(item.price_at_purchase * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="mt-3 border-t border-slate-100 pt-3">
              <p className="mb-1 text-[0.75rem] font-bold uppercase tracking-wide text-slate-400">
                Your Feedback
              </p>
              <FeedbackForm
                productId={item.product_id}
                initial={feedbacks[item.product_id]}
                onSubmitted={fetchFeedbacks}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}