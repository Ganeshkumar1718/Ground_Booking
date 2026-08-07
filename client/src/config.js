// This file centralized the API URL configuration.
// Replace the fallback URL below with your actual Render backend URL if you do not want to use Environment Variables in Vercel.

export const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  : 'https://ground-booking-1-6kku.onrender.com';
