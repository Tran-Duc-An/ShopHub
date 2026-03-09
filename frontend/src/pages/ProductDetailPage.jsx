import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/products/${id}`)
      .then(res => res.json())
      .then(data => { setProduct(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!token) { navigate('/login'); return; }
    setMessage('');
    setError('');
    setAdding(true);
    try {
      const res = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.product_id, quantity })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage('Added to cart!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="loader">Loading product...</div>;
  if (!product) return <div className="error-message">Product not found</div>;

  const discount = product.initial_price > product.final_price
    ? Math.round((1 - product.final_price / product.initial_price) * 100)
    : 0;

  return (
    <div className="page-container">
      <Link to="/" className="back-link">&larr; Back to Products</Link>

      <div className="product-detail">
        <div className="product-detail-image">
          <img src={product.image_url} alt={product.product_name} />
        </div>

        <div className="product-detail-info">
          <div className="product-detail-tags">
            {product.brand && <span className="tag tag-brand">{product.brand}</span>}
            {product.category && <span className="tag tag-category">{product.category}</span>}
            {product.stock_quantity > 0 && product.stock_quantity <= 5 && <span className="tag tag-sale">Low Stock</span>}
          </div>
          <h1>{product.product_name}</h1>

          <div className="price-row">
            <span className="final-price" style={{ fontSize: '1.75rem' }}>${product.final_price}</span>
            {discount > 0 && (
              <>
                <span className="old-price">${product.initial_price}</span>
                <span className="discount-badge">-{discount}%</span>
              </>
            )}
          </div>

          {product.rating && (
            <div className="rating-display">
              {'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}
              <span className="rating-text">{product.rating} ({product.reviews_count || 0} reviews)</span>
            </div>
          )}

          {product.description && (
            <div className="product-description-wrap">
              <p className={`product-description${showFullDesc ? '' : ' clamped'}`}>{product.description}</p>
              {product.description.length > 200 && (
                <button className="read-more-btn" onClick={() => setShowFullDesc(!showFullDesc)}>
                  {showFullDesc ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          )}

          <p className="stock-info">
            {product.stock_quantity > 0
              ? <span className="in-stock">In Stock ({product.stock_quantity} available)</span>
              : <span className="out-of-stock">Out of Stock</span>}
          </p>

          {product.seller_name && <p className="seller-info">Sold by: <Link to={`/seller/${product.seller_id}`} className="seller-link">{product.seller_name}</Link></p>}

          {product.stock_quantity > 0 && (
            <div className="add-to-cart-section">
              <div className="qty-control">
                <button onClick={() => quantity > 1 && setQuantity(quantity - 1)}>−</button>
                <span>{quantity}</span>
                <button onClick={() => quantity < product.stock_quantity && setQuantity(quantity + 1)}>+</button>
              </div>
              <button className="btn btn-primary btn-lg" onClick={addToCart} disabled={adding}>
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
