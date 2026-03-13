/**
 * hooks/useProducts.js
 *
 * Paginated product list with filters.
 * Usage:
 *   const { products, total, page, setPage, filters, setFilters, loading } = useProducts()
 */

import { useState, useEffect, useCallback } from 'react';
import { productsApi } from '@/lib/api';
import { PRODUCTS_PER_PAGE } from '@/lib/constants';

export function useProducts(initialFilters = {}) {
  const [products, setProducts]   = useState([]);
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState(initialFilters);

  const fetchProducts = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const data = await productsApi.getAll({
        page: p,
        limit: PRODUCTS_PER_PAGE,
        ...filters,
      });
      setProducts(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
      setPage(data.page || p);
    } catch {
      // silently fail — page shows empty state
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchProducts(page); }, [filters, page]);

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  return {
    products,
    page,
    setPage,
    totalPages,
    total,
    loading,
    filters,
    updateFilters,
    clearFilters,
    refresh: fetchProducts,
  };
}