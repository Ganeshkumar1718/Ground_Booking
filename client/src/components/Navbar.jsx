import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, X, Bell, LogOut, User, MapPin, Moon, Sun, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  // Theme toggle effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove('light-mode');
    } else {
      document.documentElement.classList.add('light-mode');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (user) {
      axios.get('/api/notifications')
        .then(res => setNotifications(res.data))
        .catch(err => console.error('Error fetching notifications:', err));

      if (!socketRef.current) {
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        socketRef.current = io(socketUrl, { withCredentials: true });
      }
      
      const s = socketRef.current;
      if (s.disconnected) {
        s.connect();
      }
      
      s.emit('join', user.id);
      
      const handleNewNotif = (notif) => {
        setNotifications(prev => [notif, ...prev]);
        toast.success(notif.message, { duration: 5000, position: 'top-right' });
      };

      s.on('newNotification', handleNewNotif);

      return () => {
        s.off('newNotification', handleNewNotif);
      };
    } else if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0f16]/90 backdrop-blur-md border-b border-white/5 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="relative flex items-center justify-center">
            {/* Custom A logo placeholder */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L2 30H9L16 16L23 30H30L16 2Z" fill="#22c55e"/>
              <path d="M16 16L9 30H16V16Z" fill="#16a34a"/>
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wide">PlayArena</span>
            <span className="text-[9px] text-[#22c55e] tracking-widest font-semibold uppercase mt-[1px]">Book • Play • Win</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        {!isAuthPage && (
          <div className="hidden items-center space-x-8 lg:flex text-sm font-medium">
            {[
              { path: '/', label: 'Home' },
              { path: '/explore', label: 'Grounds' },
              { path: '/user/bookings', label: 'Bookings' },
              { path: '/tournaments', label: 'Tournaments' },
              { path: '/contact', label: 'Contact Us' }
            ].map(link => {
              const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
              return (
                <Link 
                  key={link.path}
                  to={link.path} 
                  className={isActive 
                    ? "text-[#22c55e] relative after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-full after:h-0.5 after:bg-[#22c55e]"
                    : "text-gray-300 hover:text-white transition-colors"
                  }
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
        {/* Right Actions */}
        {!isAuthPage && (
          <div className="hidden items-center space-x-5 md:flex">
          
          {/* Location Selector */}
          <button className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-full text-sm text-gray-200 transition-colors border border-white/5">
            <MapPin className="h-4 w-4 text-[#22c55e]" />
            <span>Chennai</span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>

          {/* Dark Mode Toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 transition-colors border border-white/5 cursor-pointer"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="relative flex items-center space-x-4">
              {/* Notification Bell */}
              <button 
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/5 cursor-pointer"
              >
                <Bell className="h-4 w-4 text-gray-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#22c55e] text-[10px] font-bold text-black">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notifOpen && (
                <div className="absolute right-12 top-12 w-80 rounded-xl bg-[#111827] border border-gray-800 shadow-2xl p-4 z-50 text-gray-300 max-h-96 overflow-y-auto">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
                    <h3 className="font-bold text-white">Notifications</h3>
                    <button onClick={() => setNotifOpen(false)} className="text-xs text-[#22c55e] hover:underline">Close</button>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No notifications yet</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleMarkAsRead(n.id)}
                          className={`p-2 rounded-lg text-xs cursor-pointer hover:bg-gray-800 transition ${!n.is_read ? 'bg-gray-800 border-l-2 border-[#22c55e] font-semibold' : ''}`}
                        >
                          <p>{n.message}</p>
                          <span className="text-[10px] text-gray-500">{new Date(n.created_at).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* User profile details */}
              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 cursor-pointer focus:outline-none"
                >
                  <div className="h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 overflow-hidden">
                    {user.profile_image ? (
                      <img src={user.profile_image} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-12 w-48 rounded-xl bg-[#111827] border border-gray-800 shadow-2xl p-2 z-50 text-sm">
                    <Link 
                      to="/profile" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center space-x-2 w-full p-2 rounded-lg text-gray-300 hover:bg-gray-800 transition"
                    >
                      <User className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                    <button 
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center space-x-2 w-full p-2 mt-1 rounded-lg text-red-400 hover:bg-red-500/10 transition text-left cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link to="/login" className="bg-[#22c55e] hover:bg-[#1eb053] text-black font-semibold px-6 py-2 rounded-full text-sm transition flex items-center space-x-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <div className="w-1.5 h-1.5 rounded-full bg-black/60"></div>
              <span>Login / Sign Up</span>
            </Link>
          )}
        </div>
        )}

        {/* Mobile menu toggle */}
        {!isAuthPage && (
          <div className="lg:hidden">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg text-gray-300">
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Panel */}
      {mobileOpen && (
        <div className="mt-3 space-y-2 border-t border-white/5 pt-3 bg-[#0a0f16] px-4 pb-6 lg:hidden">
          {[
            { path: '/', label: 'Home' },
            { path: '/explore', label: 'Grounds' },
            { path: '/user/bookings', label: 'Bookings' },
            { path: '/tournaments', label: 'Tournaments' },
            { path: '/contact', label: 'Contact Us' }
          ].map(link => {
            const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
            return (
              <Link 
                key={link.path}
                to={link.path} 
                onClick={() => setMobileOpen(false)} 
                className={`block px-3 py-3 rounded-lg hover:bg-white/5 ${isActive ? 'text-[#22c55e] bg-white/5 font-semibold' : 'text-gray-300'}`}
              >
                {link.label}
              </Link>
            );
          })}
          
          <div className="flex items-center space-x-2 px-3 py-3">
            <MapPin className="h-4 w-4 text-[#22c55e]" />
            <span className="text-sm text-gray-300">Chennai</span>
          </div>

          {user && (
            <>
              <div className="border-t border-white/5 pt-3 flex items-center justify-between px-3 mt-2">
                <div className="flex items-center space-x-3">
                   <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-400" />
                   </div>
                   <span className="text-sm font-semibold">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="flex items-center space-x-1 text-red-400 text-sm bg-red-500/10 px-3 py-1.5 rounded-lg">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          )}

          {!user && (
            <div className="px-3 pt-4">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="block w-full text-center py-3 bg-[#22c55e] text-black font-bold rounded-full text-sm">Login / Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
