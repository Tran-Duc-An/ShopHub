/**
 * hooks/useGiftProfiles.js
 *
 * Encapsulates gift profile CRUD.
 * Usage: const { profiles, create, update, remove, loading } = useGiftProfiles()
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { giftProfilesApi } from '@/lib/api';

export function useGiftProfiles() {
  const { token } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const fetchProfiles = useCallback(async () => {
    if (!token) return;
    try {
      const data = await giftProfilesApi.getAll(token);
      setProfiles(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const create = async (body) => {
    const data = await giftProfilesApi.create(token, body);
    await fetchProfiles();
    return data;
  };

  const update = async (id, body) => {
    const data = await giftProfilesApi.update(token, id, body);
    await fetchProfiles();
    return data;
  };

  const remove = async (id) => {
    await giftProfilesApi.delete(token, id);
    await fetchProfiles();
  };

  return { profiles, loading, error, create, update, remove, refresh: fetchProfiles };
}