import { useAuth } from '@/context/AuthContext'
import { useProducts } from '@/hooks/useProducts'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/use-toast'
import ProductCard from '@/components/product/ProductCard'
import ProductFilters from '@/components/product/ProductFilters'
import Pagination from '@/components/ui/Pagination'
import Loader from '@/components/ui/Loader'
import EmptyState from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export default function ProductListPage() {
  const { token } = useAuth()
  const { addItem } = useCart()
  const { toast } = useToast()

  const {
    products, page, setPage, totalPages,
    total, loading, updateFilters, clearFilters,
  } = useProducts()

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
    <div className="animate-fade-up max-w-[1260px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
        <h2 className="text-[clamp(1.25rem,3.5vw,1.75rem)] font-extrabold tracking-tight text-slate-900">
          Our Collection
        </h2>
      </div>

      <ProductFilters
        onSearch={(f) => updateFilters(f)}
        onClear={clearFilters}
      />

      {loading ? (
        <Loader text="Loading products..." />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No products found"
          description="Try adjusting your filters"
          action={
            <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-[0.82rem] text-slate-400">
            {total} product{total !== 1 ? 's' : ''} found — page {page} of {totalPages}
          </p>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4
                          lg:grid-cols-[repeat(auto-fill,minmax(180px,1fr))]
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