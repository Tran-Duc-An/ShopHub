/**
 * lib/api.js
 * ─────────────────────────────────────────────────────────
 * Central API client for ShopHub.
 *
 * Usage:
 *   import { productsApi, cartApi, authApi } from '@/lib/api'
 *
 *   const data = await productsApi.getAll({ page: 1, q: 'shoes' })
 *   const cart = await cartApi.get(token)
 *
 * All functions throw an Error with the server's message on non-2xx.
 * ─────────────────────────────────────────────────────────
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const proxyImage = (url) => {
  if (!url) return '';
  return `${API_URL}/image-proxy?url=${encodeURIComponent(url)}`;
};

// ─── Core fetch wrapper ───────────────────────────────────

async function request(path, { token, method = 'GET', body, params } = {}) {
  const url = new URL(`${API_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '' && v !== null) url.searchParams.set(k, v);
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Request failed: ${res.status}`);
  return data;
}

// ─── Auth ─────────────────────────────────────────────────

export const authApi = {
  login:  (credentials) => request('/auth/login',  { method: 'POST', body: credentials }),
  signup: (userData)    => request('/auth/signup', { method: 'POST', body: userData }),
};

// ─── Products ─────────────────────────────────────────────

export const productsApi = {
  getAll:       (params)            => request('/products', { params }),
  getById:      (id)                => request(`/products/${id}`),
  getCategories:(params)            => request('/products/categories', { params }),
  getBySeller:  (sellerId, params)  => request(`/products/seller/${sellerId}`, { params }),
  getMyProducts:(token)             => request('/products/seller/me', { token }),
  create:       (token, body)       => request('/products', { token, method: 'POST', body }),
  update:       (token, id, body)   => request(`/products/${id}`, { token, method: 'PUT', body }),
  delete:       (token, id)         => request(`/products/${id}`, { token, method: 'DELETE' }),
  uploadImage:  async (token, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  },
};

// ─── Cart ─────────────────────────────────────────────────

export const cartApi = {
  get:    (token)                  => request('/cart', { token }),
  add:    (token, body)            => request('/cart', { token, method: 'POST', body }),
  update: (token, itemId, qty)     => request(`/cart/${itemId}`, { token, method: 'PUT', body: { quantity: qty } }),
  remove: (token, itemId)          => request(`/cart/${itemId}`, { token, method: 'DELETE' }),
  clear:  (token)                  => request('/cart', { token, method: 'DELETE' }),
};

// ─── Orders ───────────────────────────────────────────────

export const ordersApi = {
  getAll:  (token)       => request('/orders', { token }),
  getById: (token, id)   => request(`/orders/${id}`, { token }),
  place:   (token, body) => request('/orders', { token, method: 'POST', body }),
  cancel:  (token, id)   => request(`/orders/${id}/cancel`, { token, method: 'PUT' }),
};

// ─── Gift Profiles ────────────────────────────────────────

export const giftProfilesApi = {
  getAll:  (token)           => request('/gift-profiles', { token }),
  getById: (token, id)       => request(`/gift-profiles/${id}`, { token }),
  create:  (token, body)     => request('/gift-profiles', { token, method: 'POST', body }),
  update:  (token, id, body) => request(`/gift-profiles/${id}`, { token, method: 'PUT', body }),
  delete:  (token, id)       => request(`/gift-profiles/${id}`, { token, method: 'DELETE' }),

  addHistory:       (token, id, body)          => request(`/gift-profiles/${id}/gift-history`, { token, method: 'POST', body }),
  updateHistory:    (token, id, entryId, body) => request(`/gift-profiles/${id}/gift-history/${entryId}`, { token, method: 'PATCH', body }),
  addPreference:    (token, id, body)          => request(`/gift-profiles/${id}/preferences`, { token, method: 'POST', body }),
  removePreference: (token, id, prefId)        => request(`/gift-profiles/${id}/preferences/${prefId}`, { token, method: 'DELETE' }),
};

// ─── AI Chat ──────────────────────────────────────────────

export const aiApi = {
  chat:    (token, body) => request('/ai-chat', { token, method: 'POST', body }),
  suggest: (token, body) => request('/ai-chat/suggest', { token, method: 'POST', body }),
};

// ─── Feedback ─────────────────────────────────────────────

export const feedbackApi = {
  getAll: (token)       => request('/ai-chat/feedback', { token }),
  submit: (token, body) => request('/ai-chat/feedback', { token, method: 'POST', body }),
};