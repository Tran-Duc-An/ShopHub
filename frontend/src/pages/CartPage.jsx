import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { Link, useNavigate } from 'react-router-dom';

const RELATIONSHIPS = ['girlfriend', 'boyfriend', 'wife', 'husband', 'mom', 'dad', 'sister', 'brother', 'friend', 'child', 'colleague', 'other'];
const RELATIONSHIP_EMOJIS = {
  girlfriend: '💕', boyfriend: '💙', wife: '💍', husband: '💍',
  mom: '🌸', dad: '👔', sister: '👯', brother: '🤝',
  friend: '🤗', child: '🧒', colleague: '💼', other: '🎁'
};

const CartPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  // New: recipient state per product
  const [recipients, setRecipients] = useState({});

  // Gift profiles for name suggestions
  const [giftProfiles, setGiftProfiles] = useState([]);

  // Fetch gift profiles for name/relationship suggestions
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const res = await fetch('/api/gift-profiles', { headers });
        const data = await res.json();
        setGiftProfiles(data.data || []);
      } catch {}
    };
    fetchProfiles();
  }, [token]);

  // Auto-fill recipients from selected profile (if any)
  useEffect(() => {
    const profileRaw = localStorage.getItem('selectedGiftProfile');
    let profile = null;
    try { if (profileRaw) profile = JSON.parse(profileRaw); } catch {}
    if (!profile) return;
    setRecipients(prev => {
      const newRecipients = { ...prev };
      if (cart && cart.items) {
        cart.items.forEach(item => {
          if (!newRecipients[item.product_id]) {
            newRecipients[item.product_id] = {
              recipient: profile.relationship,
              recipient_name: profile.name
            };
          }
        });
      }
      return newRecipients;
    });
  }, [cart]);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchCart = () => {
    fetch(`${API_URL}/cart`, { headers })
      .then(res => res.json())
      .then(data => { setCart(data.data); setLoading(false); })
      .catch(() => { setError('Failed to load cart'); setLoading(false); });
  };

  useEffect(() => { fetchCart(); }, []);

  const updateQty = async (cartItemId, quantity) => {
    await fetch(`${API_URL}/cart/${cartItemId}`, {
      method: 'PUT', headers, body: JSON.stringify({ quantity })
    });
    fetchCart();
  };

  const removeItem = async (cartItemId) => {
    await fetch(`${API_URL}/cart/${cartItemId}`, { method: 'DELETE', headers });
    fetchCart();
  };

  const clearCart = async () => {
    await fetch(`${API_URL}/cart`, { method: 'DELETE', headers });
    fetchCart();
  };

  const placeOrder = async () => {
    setPlacing(true);
    setError('');
    try {
      // Prepare recipients map: { productId: { recipient, recipient_name } }
      const body = {
        recipients: recipients
      };
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      navigate(`/orders/${data.data.order_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loader">Loading cart...</div>;
  if (error && !cart) return <div className="error-message">{error}</div>;

  const items = cart?.items || [];

  return (
    <div className="page-container">
      <h2>Shopping Cart</h2>
      {items.length > 0 && <p className="results-count">{items.length} item{items.length !== 1 ? 's' : ''}</p>}

      {error && <div className="error-message">{error}</div>}

      {items.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is empty</p>
          <Link to="/" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <>
          <div className="cart-list">
            {items.map(item => (
              <div key={item.cart_item_id} className="cart-item">
                <div className="cart-item-image">
                  <img src={item.image_url} alt={item.product_name} loading="lazy" />
                </div>
                <div className="cart-item-details">
                  <Link to={`/products/${item.product_id}`} className="cart-item-name">{item.product_name}</Link>
                  <span className="tag tag-brand">{item.brand}</span>
                  <span className="final-price">${item.final_price}</span>
                  {/* Recipient selection */}
                  <div className="recipient-select" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                    <label style={{ fontSize: '0.95em', marginRight: 2, fontWeight: 500 }}>Gift for:</label>
                    <select
                      value={recipients[item.product_id]?.recipient || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setRecipients(prev => ({
                          ...prev,
                          [item.product_id]: {
                            ...(prev[item.product_id] || {}),
                            recipient: val
                          }
                        }));
                      }}
                      style={{ minWidth: 90, padding: '2px 6px' }}
                    >
                      <option value="">Select...</option>
                      {RELATIONSHIPS.map(r => (
                        <option key={r} value={r}>
                          {RELATIONSHIP_EMOJIS[r] ? RELATIONSHIP_EMOJIS[r] + ' ' : ''}{r.charAt(0).toUpperCase() + r.slice(1)}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      list="recipient-names"
                      placeholder="Name (optional)"
                      style={{ width: 120, padding: '2px 6px' }}
                      value={recipients[item.product_id]?.recipient_name || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setRecipients(prev => ({
                          ...prev,
                          [item.product_id]: {
                            ...(prev[item.product_id] || {}),
                            recipient_name: val
                          }
                        }));
                      }}
                    />
                    <datalist id="recipient-names">
                      {giftProfiles.map(p => (
                        <option key={p.profile_id} value={p.name} />
                      ))}
                    </datalist>
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="qty-control">
                    <button onClick={() => item.quantity > 1 && updateQty(item.cart_item_id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.cart_item_id, item.quantity + 1)}>+</button>
                  </div>
                  <span className="item-subtotal">${(item.final_price * item.quantity).toFixed(2)}</span>
                  <button className="btn btn-danger-sm" onClick={() => removeItem(item.cart_item_id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              <span>Total:</span>
              <span className="total-amount">${cart.total.toFixed(2)}</span>
            </div>
            <div className="cart-buttons">
              <button className="btn btn-secondary" onClick={clearCart}>Clear Cart</button>
              <button className="btn btn-primary" onClick={placeOrder} disabled={placing}>
                {placing ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
