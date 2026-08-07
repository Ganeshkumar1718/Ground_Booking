import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios';

const defaultUrl = import.meta.env.PROD 
  ? 'https://ground-booking-1-6kku.onrender.com' 
  : 'http://localhost:5000';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || defaultUrl;
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
