// This file centralized the API URL configuration.
// Replace the fallback URL below with your actual Render backend URL if you do not want to use Environment Variables in Vercel.

export const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname.includes('vercel.app') 
    ? 'https://your-backend-app.onrender.com' // <-- Replace this with your actual Render backend URL
    : 'http://localhost:5000'
);
