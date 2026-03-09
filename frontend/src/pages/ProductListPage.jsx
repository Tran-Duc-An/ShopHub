import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const PRODUCTS_PER_PAGE = 20;

const ProductList = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter state
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState('');
  const [sort, setSort] = useState('');

  const fetchProducts = (p = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', p);
    params.set('limit', PRODUCTS_PER_PAGE);
    if (q) params.set('q', q);
    if (brand) params.set('brand', brand);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (rating) params.set('rating', rating);
    if (sort) params.set('sort', sort);

    fetch(`${API_URL}/products?${params}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(page); }, [sort, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(1);
  };

  const clearFilters = () => {
    setQ(''); setBrand(''); setMinPrice(''); setMaxPrice(''); setRating(''); setSort('');
    setPage(1);
    setTimeout(() => fetchProducts(1), 0);
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

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

  const hasActiveFilters = q || brand || minPrice || maxPrice || rating;

  return (
    <div className="product-container">
      <div className="product-page-header">
        <h2>Our Collection</h2>
        <button
          className="btn btn-secondary filter-toggle-btn"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          {filtersOpen ? '✕ Close Filters' : '⚙ Filters'}
          {hasActiveFilters && <span className="filter-dot"></span>}
        </button>
      </div>

      {message && <div className="toast-message">{message}</div>}

      <form className={`filter-bar ${filtersOpen ? 'filter-bar-open' : ''}`} onSubmit={handleSearch}>
        <input placeholder="Search products..." value={q} onChange={e => setQ(e.target.value)} />
        <input placeholder="Brand" value={brand} onChange={e => setBrand(e.target.value)} />
        <input type="number" placeholder="Min $" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
        <input type="number" placeholder="Max $" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
        <select value={rating} onChange={e => setRating(e.target.value)}>
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
          <option value="2">2+ Stars</option>
        </select>
        <select value={sort} onChange={e => setSort(e.target.value)}>
          <option value="">Default Sort</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="rating">Highest Rated</option>
          <option value="newest">Newest</option>
        </select>
        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">Search</button>
          <button type="button" className="btn btn-secondary" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      {loading ? (
        <div className="loader">Loading amazing products...</div>
      ) : products.length === 0 ? (
        <div className="empty-state"><p>No products found. Try different filters.</p></div>
      ) : (
        <>
          <p className="results-count">{total} product{total !== 1 ? 's' : ''} found — page {page} of {totalPages}</p>
          <div className="product-grid">
            {products.map((product) => {
              const discount = product.initial_price > product.final_price
                ? Math.round((1 - product.final_price / product.initial_price) * 100)
                : 0;
              return (
              <div key={product.product_id} className="product-card">
                {discount > 0 && <span className="tag tag-sale card-sale-tag">-{discount}%</span>}
                <Link to={`/products/${product.product_id}`} className="image-wrapper">
                  <img src={product.image_url} alt={product.product_name} loading="lazy" />
                </Link>
                <div className="product-info">
                  <div className="product-tags">
                    {product.brand && <span className="tag tag-brand">{product.brand}</span>}
                    {product.category && <span className="tag tag-category">{product.category}</span>}
                  </div>
                  <h3><Link to={`/products/${product.product_id}`}>{product.product_name}</Link></h3>
                  <div className="price-row">
                    <span className="final-price">${product.final_price}</span>
                    {product.initial_price > product.final_price && (
                      <span className="old-price">${product.initial_price}</span>
                    )}
                  </div>
                  {product.rating && <span className="rating-small">{'★'.repeat(Math.round(product.rating))} {product.rating}</span>}
                  <p className="seller-info">Seller: {product.seller_name}</p>
                  <button className="add-to-cart-btn" onClick={() => addToCart(product.product_id)}>Add to Cart</button>
                </div>
              </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
              >
                ‹ Prev
              </button>
              {getPageNumbers()[0] > 1 && (
                <>
                  <button className="pagination-btn" onClick={() => goToPage(1)}>1</button>
                  {getPageNumbers()[0] > 2 && <span className="pagination-dots">…</span>}
                </>
              )}
              {getPageNumbers().map(p => (
                <button
                  key={p}
                  className={`pagination-btn${p === page ? ' active' : ''}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}
              {getPageNumbers().slice(-1)[0] < totalPages && (
                <>
                  {getPageNumbers().slice(-1)[0] < totalPages - 1 && <span className="pagination-dots">…</span>}
                  <button className="pagination-btn" onClick={() => goToPage(totalPages)}>{totalPages}</button>
                </>
              )}
              <button
                className="pagination-btn"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
              >
                Next ›
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductList;