import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { productsApi } from '@/lib/api'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/use-toast'
import ProductCard from '@/components/product/ProductCard'
import Loader from '@/components/ui/Loader'
import EmptyState from '@/components/ui/EmptyState'

const PREVIEW_LIMIT = 20

export default function SellerPage() {
  const { sellerId } = useParams()
  const { token } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [seller, setSeller]         = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')

    const sellerReq = productsApi
      .getBySeller(sellerId, { limit: 1 })
      .then((data) => { if (data.seller) setSeller(data.seller) })

    const catsReq = productsApi
      .getCategories({ limit: PREVIEW_LIMIT, seller_id: sellerId })
      .then((data) => setCategories(data.data || []))

    Promise.all([sellerReq, catsReq])
      .catch(() => setError('Failed to load seller page'))
      .finally(() => setLoading(false))
  }, [sellerId])

  const handleAddToCart = async (productId) => {
    if (!token) {
      toast({ title: 'Please log in first', variant: 'destructive' })
      return
    }
    try {
      await addItem(productId)
      toast({ title: 'Added to cart!' })
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' })
    }
  }

  if (loading) return <Loader text="Loading seller page..." />
  if (error)   return <p className="py-20 text-center text-slate-500">{error}</p>

  const totalProducts = categories.reduce((sum, c) => sum + c.count, 0)

  return (
    <div className="animate-fade-up max-w-[1260px] mx-auto">
      {/* Seller header */}
      <div className="mb-6 px-4 pt-4">
        <Link
          to="/"
          className="mb-3 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[0.875rem]
                     font-semibold text-indigo-600 no-underline hover:bg-indigo-50"
        >
          ← Home
        </Link>

        <div className="flex items-center gap-4 sm:flex-col sm:items-start">
          <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full
                          bg-gradient-to-br from-indigo-500 to-violet-600 text-[1.5rem]
                          font-black text-white shadow-card flex-shrink-0">
            {seller?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-[1.75rem] font-extrabold tracking-tight text-slate-900 md:text-[1.25rem]">
              {seller?.name}
            </h1>
            <p className="text-[0.82rem] text-slate-400">
              {totalProducts} product{totalProducts !== 1 ? 's' : ''} ·{' '}
              {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
            </p>
          </div>
        </div>
      </div>

      {/* Category rows */}
      {categories.length === 0 ? (
        <EmptyState icon="📦" title="No products yet" description="This seller hasn't listed anything." />
      ) : (
        categories.map((cat) => (
          <section key={cat.category} className="mb-8 px-4">
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-[1.15rem] font-bold text-slate-900">{cat.category}</h2>
              <span className="text-[0.82rem] text-slate-400">
                {cat.count} product{cat.count !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-thin
                            [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch]">
              {cat.products.map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  compact
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}