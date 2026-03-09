import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { Link } from 'react-router-dom';

const statusColors = {
  pending: '#f59e0b',
  paid: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#ef4444'
};

const OrdersPage = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/orders`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { setOrders(data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader">Loading orders...</div>;

  return (
    <div className="page-container">
      <h2>My Orders</h2>
      {orders.length > 0 && <p className="results-count">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>}

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders yet</p>
          <Link to="/" className="btn btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <Link to={`/orders/${order.order_id}`} key={order.order_id} className="order-card">
              <div className="order-header">
                <span className="order-id">Order #{order.order_id}</span>
                <span className="order-status" style={{ background: statusColors[order.status] || '#6b7280' }}>
                  {order.status}
                </span>
              </div>
              <div className="order-body">
                <span>{order.item_count} item{order.item_count > 1 ? 's' : ''}</span>
                <span className="order-total">${order.total_amount.toFixed(2)}</span>
              </div>
              <div className="order-date">{new Date(order.created_at).toLocaleDateString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
