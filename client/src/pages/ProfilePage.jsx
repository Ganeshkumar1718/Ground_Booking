import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Camera, User, Phone, Mail, Shield, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getImageUrl } from '../config';

export default function ProfilePage() {
  const { user, login } = useContext(AuthContext); // We'll re-login to update context with new image
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (user) {
      axios.get('/api/user/search-history')
        .then(res => {
          setSearchHistory(res.data);
          setLoadingHistory(false);
        })
        .catch(err => {
          console.error('Error fetching search history:', err);
          setLoadingHistory(false);
        });
    }
  }, [user]);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await axios.post('/api/auth/upload-profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(res.data.message);
      
      // Update local storage and context
      // Note: we might not have the full token here if we just override user, 
      // but in this mock environment, reloading or fetching /me could also work.
      // Easiest is to force a page reload to pull fresh data, or update the context if a function exists.
      window.location.reload(); 
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Cover Photo Area */}
        <div className="h-32 bg-gradient-to-r from-emerald-900 to-slate-900 border-b border-emerald-500/20"></div>
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-4">
            
            {/* Avatar with Upload */}
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-slate-800 border-4 border-slate-900 overflow-hidden flex items-center justify-center relative">
                {user.profile_image ? (
                  <img src={getImageUrl(user.profile_image)} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-slate-500" />
                )}
                
                {/* Overlay Upload Button */}
                <button 
                  onClick={handleImageClick}
                  disabled={isUploading}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>
            </div>
            
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider">
                {user.role} Account
              </span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white">{user.name}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg"><Mail className="h-5 w-5 text-emerald-500" /></div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Email Address</p>
                <p className="text-sm font-semibold text-slate-300">{user.email}</p>
              </div>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg"><Phone className="h-5 w-5 text-emerald-500" /></div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Phone Number</p>
                <p className="text-sm font-semibold text-slate-300">{user.phone}</p>
              </div>
            </div>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg"><Shield className="h-5 w-5 text-emerald-500" /></div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Account Status</p>
                <p className="text-sm font-semibold text-emerald-400 capitalize">{user.status}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Search History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 mt-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Searches</h3>
        {loadingHistory ? (
          <p className="text-slate-400 text-sm">Loading history...</p>
        ) : searchHistory.length > 0 ? (
          <ul className="space-y-3">
            {searchHistory.map(item => (
              <li key={item.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p className="text-sm text-emerald-400 font-semibold">{item.search_term ? `Search: "${item.search_term}"` : 'Filtered Search'}</p>
                {item.filters && Object.keys(item.filters).length > 0 && (
                  <p className="text-xs text-slate-400 mt-1">Filters: {JSON.stringify(item.filters)}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">{new Date(item.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-400 text-sm">No recent searches found.</p>
        )}
      </div>
      
    </div>
  );
}
