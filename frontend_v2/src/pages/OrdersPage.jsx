import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ordersApi } from '@/lib/api'
import { ORDER_STATUS_STYLES } from '@/lib/constants'
import Loader from '@/components/ui/Loader'
import EmptyState from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function OrdersPage() {
  const { token } = useAuth()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersApi.getAll(token)
      .then((data) => setOrders(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <Loader text="Loading orders..." />

  return (
    <div className="animate-fade-up max-w-[820px] mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h2 className="text-[1.75rem] font-extrabold tracking-tight text-slate-900 md:text-[1.25rem]">
          My Orders
        </h2>
        {orders.length > 0 && (
          <span className="text-[0.82rem] text-slate-400">
            {orders.length} order{orders.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="Your order history will appear here"
          action={
            <Link to="/">
              <Button>Start Shopping</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <Link
              key={order.order_id}
              to={`/orders/${order.order_id}`}
              className="flex items-center justify-between gap-4 rounded-card border
                         border-slate-200 bg-white px-5 py-4 no-underline
                         transition-all hover:-translate-y-0.5 hover:border-indigo-200
                         hover:shadow-card sm:flex-col sm:items-start sm:gap-2"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[0.78rem] font-mono text-slate-400">
                  #{order.order_id}
                </span>
                <span className="text-[0.9rem] font-semibold text-slate-700">
                  {order.item_count} item{order.item_count > 1 ? 's' : ''}
                </span>
                <span className="text-[0.75rem] text-slate-400">
                  {new Date(order.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-4 sm:w-full sm:justify-between">
                <span
                  className={cn(
                    'rounded-full border px-3 py-1 text-[0.72rem] font-bold uppercase tracking-wide',
                    ORDER_STATUS_STYLES[order.status] || 'bg-slate-50 text-slate-500 border-slate-200'
                  )}
                >
                  {order.status}
                </span>
                <span className="text-[1.1rem] font-extrabold text-slate-900">
                  ${order.total_amount.toFixed(2)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}