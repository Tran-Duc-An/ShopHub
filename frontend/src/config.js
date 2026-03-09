// This pulls from .env, or defaults to localhost if .env is missing
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Proxy external images through backend to bypass hot-link blocking
export const proxyImage = (url) => {
  if (!url) return '';
  return `${API_URL}/image-proxy?url=${encodeURIComponent(url)}`;
};