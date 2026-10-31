// Centralized API Base URL configuration:
// In production on Vercel, requests to /api go to the same origin seamlessly
export const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000');

export const getFullAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
};
