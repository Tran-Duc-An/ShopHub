import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function ProductCard({ product, onAddToCart, compact = false }) {
  const discount =
    product.initial_price > product.final_price
      ? Math.round((1 - product.final_price / product.initial_price) * 100)
      : 0

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-card border
                  border-slate-200 bg-white transition-all duration-200
                  hover:-translate-y-1 hover:border-indigo-200 hover:shadow-card
                  ${compact ? 'min-w-[200px] max-w-[200px] flex-shrink-0 scroll-snap-start' : ''}`}
    >
      {/* Sale badge */}
      {discount > 0 && (
        <span className="absolute left-2 top-2 z-10 rounded bg-red-50 px-1.5 py-0.5
                         text-[0.65rem] font-bold uppercase tracking-wide text-red-600">
          -{discount}%
        </span>
      )}

      {/* Image */}
      <Link
        to={`/products/${product.product_id}`}
        className={`flex w-full items-center justify-center overflow-hidden bg-slate-50
                    ${compact ? 'h-[140px]' : 'h-[150px]'}`}
      >
        <img
          src={product.image_url}
          alt={product.product_name}
          loading="lazy"
          className="max-h-[110px] max-w-[70%] object-contain transition-transform
                     duration-300 group-hover:scale-105"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      </Link>

      {/* Info */}
      <div className="flex flex-grow flex-col gap-1.5 p-[0.85rem]">
        {product.brand && (
          <span className="w-fit rounded bg-indigo-50 px-1.5 py-0.5 text-[0.65rem]
                           font-bold uppercase tracking-wide text-indigo-700">
            {product.brand}
          </span>
        )}

        <h3 className={`line-clamp-2 font-semibold leading-snug text-slate-800
                        ${compact ? 'text-[0.8rem]' : 'text-[0.82rem]'}`}>
          <Link
            to={`/products/${product.product_id}`}
            className="no-underline hover:text-indigo-600"
          >
            {product.product_name}
          </Link>
        </h3>

        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[1.05rem] font-extrabold text-slate-900">
            ${product.final_price}
          </span>
          {product.initial_price > product.final_price && (
            <span className="text-[0.8rem] text-slate-400 line-through">
              ${product.initial_price}
            </span>
          )}
        </div>

        {product.rating && (
          <span className="flex items-center gap-1 text-[0.78rem] text-amber-500">
            {'★'.repeat(Math.round(product.rating))} {product.rating}
          </span>
        )}

        {!compact && product.seller_name && (
          <p className="text-[0.72rem] text-slate-400">
            Seller:{' '}
            <Link
              to={`/seller/${product.seller_id}`}
              className="font-medium text-indigo-400 no-underline hover:underline"
            >
              {product.seller_name}
            </Link>
          </p>
        )}

        <Button
          size="sm"
          className="mt-auto w-full bg-indigo-600 text-white text-xs font-semibold border border-indigo-700 shadow hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          onClick={() => onAddToCart?.(product.product_id)}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  )
}