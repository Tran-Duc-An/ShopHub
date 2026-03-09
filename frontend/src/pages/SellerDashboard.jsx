import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

const SellerDashboard = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const emptyForm = { product_name: '', description: '', brand: '', initial_price: '', final_price: '', currency: 'USD', image_url: '', stock_quantity: '100' };
  const [form, setForm] = useState(emptyForm);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchProducts = () => {
    fetch(`${API_URL}/products/seller/me`, { headers })
      .then(res => res.json())
      .then(data => { setProducts(data.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const uploadImage = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForm(prev => ({ ...prev, image_url: data.url }));
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) uploadImage(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const url = editingId ? `${API_URL}/products/${editingId}` : `${API_URL}/products`;
    const method = editingId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSuccess(editingId ? 'Product updated!' : 'Product created!');
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (product) => {
    setForm({
      product_name: product.product_name || '',
      description: product.description || '',
      brand: product.brand || '',
      initial_price: product.initial_price || '',
      final_price: product.final_price || '',
      currency: product.currency || 'USD',
      image_url: product.image_url || '',
      stock_quantity: product.stock_quantity || '100'
    });
    setEditingId(product.product_id);
    setShowForm(true);
    setSuccess('');
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Product deleted');
      fetchProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loader">Loading your products...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h2>Seller Dashboard</h2>
          <p className="results-count">{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm); }}>
          {showForm ? '✕ Cancel' : '+ New Product'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="seller-form">
          <h3>{editingId ? 'Edit Product' : 'New Product'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input name="product_name" value={form.product_name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input name="brand" value={form.brand} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input name="description" value={form.description} onChange={handleChange} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Initial Price</label>
              <input type="number" step="0.01" name="initial_price" value={form.initial_price} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Final Price *</label>
              <input type="number" step="0.01" name="final_price" value={form.final_price} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <input name="currency" value={form.currency} onChange={handleChange} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group form-group-full">
              <label>Product Image</label>
              <div
                className={`dropzone${dragActive ? ' dropzone-active' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => uploadImage(e.target.files?.[0])}
                />
                {uploading ? (
                  <p className="dropzone-text">Uploading…</p>
                ) : form.image_url ? (
                  <div className="dropzone-preview">
                    <img src={form.image_url} alt="Preview" />
                    <p className="dropzone-hint">Drop or click to replace</p>
                  </div>
                ) : (
                  <div className="dropzone-placeholder">
                    <span className="dropzone-icon">📷</span>
                    <p className="dropzone-text">Drag &amp; drop an image here, or click to browse</p>
                    <p className="dropzone-hint">JPEG, PNG, GIF, WebP · max 5 MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>…or paste Image URL</label>
              <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://..." />
            </div>
            <div className="form-group">
              <label>Stock Quantity</label>
              <input type="number" name="stock_quantity" value={form.stock_quantity} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'} Product</button>
        </form>
      )}

      {products.length === 0 && !showForm ? (
        <div className="empty-state">
          <p>You haven't listed any products yet.</p>
        </div>
      ) : (
        <div className="seller-products-table">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.product_id}>
                  <td>
                    <div className="table-product">
                      {p.image_url && <img src={p.image_url} alt="" className="table-thumb" />}
                      <span>{p.product_name}</span>
                    </div>
                  </td>
                  <td>{p.brand || '-'}</td>
                  <td>${p.final_price}</td>
                  <td>{p.stock_quantity}</td>
                  <td>{p.rating ? `${p.rating} ★` : '-'}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-sm" onClick={() => startEdit(p)}>Edit</button>
                      <button className="btn btn-danger-sm" onClick={() => deleteProduct(p.product_id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
