import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchOrder = () => {
    fetch(`${API_URL}/orders/${id}`, { headers })
      .then(res => res.json())
      .then(data => { setOrder(data.data); setLoading(false); })
      .catch(() => { setError('Failed to load order'); setLoading(false); });
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const cancelOrder = async () => {
    setError('');
    try {
      const res = await fetch(`${API_URL}/orders/${id}/cancel`, { method: 'PUT', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchOrder();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loader">Loading order...</div>;
  if (!order) return <div className="error-message">Order not found</div>;

  return (
    <div className="page-container">
      <Link to="/orders" className="back-link">&larr; Back to Orders</Link>

      <div className="order-detail-header">
        <h2>Order #{order.order_id}</h2>
        <span className={`status-badge status-${order.status}`}>{order.status}</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="order-meta">
        <p>📅 Date: {new Date(order.created_at).toLocaleString()}</p>
        <p>💰 Total: <strong>${order.total_amount.toFixed(2)}</strong></p>
      </div>

      <h3 style={{ marginBottom: '1rem', fontWeight: 700, color: '#374151' }}>Items</h3>

      <div className="order-items-list">
        {order.items.map(item => (
          <div key={item.order_item_id} className="order-item">
            <div className="order-item-image">
              <img src={item.image_url} alt={item.product_name} />
            </div>
            <div className="order-item-details">
              <Link to={`/products/${item.product_id}`}>{item.product_name}</Link>
              <span className="brand-tag">{item.brand}</span>
            </div>
            <div className="order-item-numbers">
              <span>Qty: {item.quantity}</span>
              <span>${item.price_at_purchase.toFixed(2)} each</span>
              <span className="item-subtotal">${(item.price_at_purchase * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {order.status === 'pending' && (
        <button className="btn btn-danger" onClick={cancelOrder}>Cancel Order</button>
      )}
    </div>
  );
};

export default OrderDetailPage;
