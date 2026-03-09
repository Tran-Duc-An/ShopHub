import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const PREVIEW_LIMIT = 20;

const SellerPage = () => {
  const { sellerId } = useParams();
  const { token } = useAuth();
  const [seller, setSeller] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    // Fetch seller info
    const sellerPromise = fetch(`${API_URL}/products/seller/${sellerId}?limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data.seller) setSeller(data.seller);
        else setError('Seller not found');
      });

    // Fetch seller's products grouped by category
    const categoriesPromise = fetch(`${API_URL}/products/categories?limit=${PREVIEW_LIMIT}&seller_id=${sellerId}`)
      .then(res => res.json())
      .then(data => setCategories(data.data || []));

    Promise.all([sellerPromise, categoriesPromise])
      .catch(() => setError('Failed to load seller page'))
      .finally(() => setLoading(false));
  }, [sellerId]);

  const addToCart = async (productId) => {
    if (!token) { setMessage('Please log in first'); setTimeout(() => setMessage(''), 2000); return; }
    try {
      const res = await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, quantity: 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage('Added to cart!');
    } catch (err) {
      setMessage(err.message);
    }
    setTimeout(() => setMessage(''), 2000);
  };

  if (loading) return <div className="loader">Loading seller page...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const totalProducts = categories.reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className="home-container">
      <div className="seller-page-header">
        <Link to="/" className="back-link">← Home</Link>
        <div className="seller-page-info">
          <div className="seller-avatar">{seller?.name?.charAt(0).toUpperCase()}</div>
          <div>
            <h1>{seller?.name}</h1>
            <p className="seller-stats">{totalProducts} product{totalProducts !== 1 ? 's' : ''} · {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}</p>
          </div>
        </div>
      </div>

      {message && <div className="toast-message">{message}</div>}

      {categories.length === 0 ? (
        <div className="empty-state"><p>This seller has no products yet.</p></div>
      ) : (
        categories.map(cat => (
          <section key={cat.category} className="category-row">
            <div className="category-row-header">
              <h2>{cat.category}</h2>
              <span className="view-all-link">{cat.count} product{cat.count !== 1 ? 's' : ''}</span>
            </div>
            <div className="category-scroll">
              {cat.products.map(product => {
                const discount = product.initial_price > product.final_price
                  ? Math.round((1 - product.final_price / product.initial_price) * 100)
                  : 0;
                return (
                  <div key={product.product_id} className="product-card product-card-compact">
                    {discount > 0 && <span className="tag tag-sale card-sale-tag">-{discount}%</span>}
                    <Link to={`/products/${product.product_id}`} className="image-wrapper">
                      <img src={product.image_url} alt={product.product_name} loading="lazy" />
                    </Link>
                    <div className="product-info">
                      {product.brand && <span className="tag tag-brand">{product.brand}</span>}
                      <h3><Link to={`/products/${product.product_id}`}>{product.product_name}</Link></h3>
                      <div className="price-row">
                        <span className="final-price">${product.final_price}</span>
                        {product.initial_price > product.final_price && (
                          <span className="old-price">${product.initial_price}</span>
                        )}
                      </div>
                      {product.rating && <span className="rating-small">{'★'.repeat(Math.round(product.rating))} {product.rating}</span>}
                      <button className="add-to-cart-btn" onClick={() => addToCart(product.product_id)}>Add to Cart</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

export default SellerPage;
