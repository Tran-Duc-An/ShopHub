import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { productsApi } from '@/lib/api'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/use-toast'
import { SORT_OPTIONS, PRODUCTS_PER_PAGE } from '@/lib/constants'
import ProductCard from '@/components/product/ProductCard'
import Pagination from '@/components/ui/Pagination'
import Loader from '@/components/ui/Loader'
import EmptyState from '@/components/ui/EmptyState'

export default function CategoryPage() {
  const { category } = useParams()
  const { token } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()

  const [products, setProducts]     = useState([])
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const [sort, setSort]             = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => { setPage(1) }, [category])

  useEffect(() => {
    setLoading(true)
    productsApi
      .getAll({ page, limit: PRODUCTS_PER_PAGE, category, sort })
      .then((data) => {
        setProducts(data.data || [])
        setTotalPages(data.totalPages || 1)
        setTotal(data.total || 0)
        setPage(data.page || page)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category, sort, page])

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

  const handlePageChange = (p) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="animate-fade-up w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-2 sm:px-4 md:px-6">
      {/* Header */}
      <div className="pt-4 pb-2">
        <Link
          to="/"
          className="mb-2 inline-flex items-center gap-1 rounded-lg px-2 py-1
                     text-[0.875rem] font-semibold text-indigo-600 no-underline
                     transition-all hover:bg-indigo-50"
        >
          ← Home
        </Link>
        <h2 className="text-[1.75rem] font-bold text-slate-900 mb-1 md:text-[1.25rem]">
          {decodeURIComponent(category)}
        </h2>
        <p className="text-[0.82rem] text-slate-400">
          {total} product{total !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-slate-50
                      rounded-[10px] border border-slate-200">
        <span className="text-[0.82rem] font-semibold text-slate-500">Sort by</span>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1) }}
          className="rounded-lg border-[1.5px] border-slate-200 bg-white px-3
                     py-1.5 text-[0.82rem] outline-none focus:border-indigo-400"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Loader text="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState icon="📦" title="No products found" description="Nothing in this category yet." />
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4
                          md:grid-cols-2 md:gap-2.5">
            {products.map((product) => (
              <ProductCard
                key={product.product_id}
                product={product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
        </>
      )}
    </div>
  )
}