import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { productsApi, proxyImage } from '@/lib/api'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import Loader from '@/components/ui/Loader'
export default function ProductDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    productsApi.getById(id)
      .then((data) => setProduct(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!token) { navigate('/login'); return; }
    setAdding(true);
    try {
      await addItem(product.product_id, quantity);
      toast({ title: `Added ${quantity}× to cart!` });
    } catch (err) {
      toast({ title: err.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loader text="Loading product..." />;
  if (!product) return (
    <div className="py-20 text-center text-slate-500">
      Product not found. <Link to="/" className="text-indigo-600 hover:underline">Go home</Link>
    </div>
  );

  const discount = product.initial_price > product.final_price
    ? Math.round((1 - product.final_price / product.initial_price) * 100)
    : 0;
  const descLong = product.description?.length > 200;

  return (
    <div className="page-container animate-fade-up">
      <Link to="/" className="back-link">&larr; Back to Products</Link>
      <div className="product-detail grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-8 md:gap-12 mt-2 items-start">
        {/* Image */}
        <div className="bg-white rounded-xl p-4 md:p-6 flex items-center justify-center border border-slate-200 shadow-sm min-h-[320px]">
          <img
            src={product.image_url}
            alt={product.product_name}
            className="max-w-[90%] max-h-[260px] object-contain rounded-md"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        {/* Info */}
        <div className="flex flex-col gap-3 md:gap-4">
          <div className="flex flex-wrap gap-2 mb-1">
            {product.brand && <span className="tag tag-brand">{product.brand}</span>}
            {product.category && <span className="tag tag-category">{product.category}</span>}
            {product.stock_quantity > 0 && product.stock_quantity <= 5 && <span className="tag tag-sale">Low Stock</span>}
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold leading-tight tracking-tight text-slate-900">{product.product_name}</h1>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl md:text-3xl font-black text-slate-900">${product.final_price}</span>
            {discount > 0 && <><span className="old-price">${product.initial_price}</span><span className="discount-badge">-{discount}%</span></>}
          </div>
          {product.rating && (
            <div className="flex items-center gap-2 text-yellow-500 text-base">
              <span>{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
              <span className="text-slate-500 text-sm font-medium">{product.rating} ({product.reviews_count || 0} reviews)</span>
            </div>
          )}
          {product.description && (
            <div className="flex flex-col gap-1">
              <p className={`text-slate-600 leading-relaxed text-[0.97rem] ${descLong && !showFullDesc ? 'line-clamp-3' : ''}`}>{product.description}</p>
              {descLong && (
                <button type="button" className="text-indigo-600 hover:underline text-[0.85rem] mt-1" onClick={() => setShowFullDesc(!showFullDesc)}>
                  {showFullDesc ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          )}
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-sm">
              {product.stock_quantity > 0
                ? <span className="text-green-600 font-semibold">In Stock ({product.stock_quantity} available)</span>
                : <span className="text-red-500 font-semibold">Out of Stock</span>}
            </span>
            {product.seller_name && <span className="text-sm text-slate-500">Sold by: <Link to={`/seller/${product.seller_id}`} className="text-indigo-600 hover:underline">{product.seller_name}</Link></span>}
          </div>
          {product.stock_quantity > 0 && (
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button type="button" className="w-8 h-8 text-lg font-bold text-slate-700 hover:bg-slate-200 transition" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
                <span className="w-10 text-center font-semibold select-none">{quantity}</span>
                <button type="button" className="w-8 h-8 text-lg font-bold text-slate-700 hover:bg-slate-200 transition" onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}>+</button>
              </div>
              <button
                type="button"
                className="px-8 py-3 text-base font-semibold rounded-md bg-indigo-600 text-white border border-indigo-700 shadow hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
    