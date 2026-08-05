import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create Axios default config
// Removed hardcoded baseURL to allow Vite proxy to handle /api requests during development
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Sync token to Axios headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
      
      // Fetch user profile to verify token and load details
      axios.get('/api/auth/me')
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Session verify failed:', err);
          logout();
          setLoading(false);
        });
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Network login error' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Network registration error' };
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put('/api/auth/profile', profileData);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      throw err.response?.data || { message: 'Network profile update error' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
