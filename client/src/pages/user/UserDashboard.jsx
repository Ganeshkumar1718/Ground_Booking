import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import { Calendar, Bell, ShieldCheck, Heart, User, ArrowRight, Activity, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UserDashboard() {
  const { user } = useContext(AuthContext);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch bookings
    axios.get('/api/bookings/my')
      .then(res => {
        // filter future confirmed bookings
        const now = new Date();
        const filtered = res.data.filter(b => {
          const bookingDate = new Date(b.booking_date);
          return b.booking_status === 'confirmed' && bookingDate >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
        });
        setUpcomingBookings(filtered.slice(0, 3));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading bookings:', err);
        setLoading(false);
      });

    // Fetch notifications
    axios.get('/api/notifications')
      .then(res => setNotifications(res.data.slice(0, 5)))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div>
          <h1 className="text-2xl font-bold text-white">Hey, {user?.name}! 👋</h1>
          <p className="text-xs text-slate-400 mt-1">Ready for a game today? Browse courts and reserve slots instantly.</p>
        </div>
        <Link 
          to="/explore"
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          Book Turf Now <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upcoming matches */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" /> Upcoming Matches
            </h3>
            <Link to="/user/bookings" className="text-xs text-emerald-400 hover:underline">View All</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(n => <div key={n} className="h-24 bg-slate-900 border border-slate-800 rounded-xl animate-pulse"></div>)}
            </div>
          ) : upcomingBookings.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-slate-500 text-xs">
              No upcoming confirmed games found. Find a pitch to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(b => (
                <div key={b.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] uppercase font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                      {b.sport_name}
                    </span>
                    <h4 className="font-bold text-sm text-white">{b.ground_name}</h4>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" /> {b.city}
                    </p>
                  </div>

                  <div className="text-right space-y-1">
                    <span className="text-xs font-semibold text-slate-200 block">
                      {new Date(b.booking_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono block flex items-center gap-1 justify-end">
                      <Clock className="h-3 w-3" /> {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System updates/Notifications Log */}
        <div className="space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-500 animate-pulse" /> Notifications Activity
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 divide-y divide-slate-850">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No notifications history</p>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="py-3 first:pt-0 last:pb-0 text-xs">
                  <p className={`text-slate-300 ${!n.is_read ? 'font-semibold text-white' : ''}`}>{n.message}</p>
                  <span className="text-[9px] text-slate-500 block mt-1">{new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
