import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { productsApi } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useCart } from '@/hooks/useCart'
import ProductCard from '@/components/product/ProductCard'
import Loader from '@/components/ui/Loader'

const PREVIEW_LIMIT = 20

export default function HomePage() {
  const { token } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    productsApi
      .getCategories({ limit: PREVIEW_LIMIT })
      .then((data) => setCategories(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

  if (loading) return <Loader text="Loading categories..." />

  return (
    <div className="animate-fade-up w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-2 sm:px-4 md:px-6">
      {/* Hero */}
      <div className="py-10 text-center px-4">
        <h1 className="text-[2rem] font-bold text-slate-900 mb-1 md:text-[1.5rem]">
          Welcome to ShopHub
        </h1>
        <p className="text-slate-500 text-[1rem]">
          Browse by category or{' '}
          <Link to="/products" className="font-semibold text-indigo-600 hover:underline">
            view all products
          </Link>
        </p>
      </div>

      {/* Category rows */}
      {categories.map((cat) => (
        <section key={cat.category} className="mb-8 px-4">
          {/* Row header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[1.25rem] font-bold text-slate-900 md:text-[1.1rem]">
              {cat.category}
            </h2>
            <Link
              to={`/category/${encodeURIComponent(cat.category)}`}
              className="text-[0.9rem] font-semibold text-indigo-600 no-underline
                         whitespace-nowrap hover:underline"
            >
              View all {cat.count} →
            </Link>
          </div>

          {/* Horizontal scroll */}
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
      ))}
    </div>
  )
}