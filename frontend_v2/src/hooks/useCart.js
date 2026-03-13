/**
 * hooks/useCart.js
 *
 * Encapsulates all cart fetch/mutate logic.
 * Pages just call: const { cart, addItem, removeItem, loading } = useCart()
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { cartApi } from '@/lib/api';

export function useCart() {
  const { token } = useAuth();
  const [cart, setCart]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const fetchCart = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await cartApi.get(token);
      setCart(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = async (productId, quantity = 1) => {
    await cartApi.add(token, { product_id: productId, quantity });
    await fetchCart();
  };

  const updateItem = async (cartItemId, quantity) => {
    await cartApi.update(token, cartItemId, quantity);
    await fetchCart();
  };

  const removeItem = async (cartItemId) => {
    await cartApi.remove(token, cartItemId);
    await fetchCart();
  };

  const clearCart = async () => {
    await cartApi.clear(token);
    await fetchCart();
  };

  return {
    cart,
    items: cart?.items || [],
    total: cart?.total || 0,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refresh: fetchCart,
  };
}