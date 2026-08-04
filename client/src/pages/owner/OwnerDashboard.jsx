import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShieldCheck, Plus, List, LayoutDashboard, Calendar, DollarSign, Heart, Star, Activity, PlusCircle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OwnerDashboard() {
  const [grounds, setGrounds] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Aggregated Stats
  const [stats, setStats] = useState({
    totalGrounds: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    totalLikes: 0,
    avgRating: 0
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Load bookings list (already role-filtered for owner)
        const bookingsRes = await axios.get('/api/bookings/my');
        // Load grounds list (we need to filter for owner, or fetch owner grounds. Let's load the general list and filter by owner, or fetch an owner-specific route.
        // Wait, does the backend have a filter? We can call /api/grounds. However, /api/grounds only returns approved grounds. Let's make sure owners can see all their grounds (draft, pending, approved).
        // Let's call /api/admin/pending-grounds or let's create a route for owners: GET /api/owner/grounds. Or we can filter the database return.
        // Wait! Let's check: the owner can fetch /api/grounds. But since owners can only manage their own grounds, let's verify if we have a way to fetch all grounds for owner.
        // Let's check groundController.js: getGrounds handles filtering. But it has: WHERE g.status = 'approved'.
        // What about fetching owner-specific grounds? 
        // Let's create an inline route inside server.js or modify groundController to allow fetching owner's own grounds if a parameter or header is passed. E.g.
        // Let's add an inline route in server.js to fetch owner's grounds! That is extremely clean and simple:
        // app.get('/api/owner/grounds', protect, checkRole(['owner']), async (req, res) => { ... })
        // Let's do that! But wait, let's write OwnerDashboard.jsx first. It will call `/api/owner/grounds`. We will write the backend route shortly.
        
        const groundsRes = await axios.get('/api/owner/grounds');
        
        setGrounds(groundsRes.data);
        setBookings(bookingsRes.data);

        // Aggregate statistics
        const totalGrounds = groundsRes.data.length;
        const totalBookings = bookingsRes.data.length;
        
        const monthlyRevenue = bookingsRes.data
          .filter(b => b.payment_status === 'paid')
          .reduce((sum, b) => sum + parseFloat(b.amount), 0);

        const totalLikes = groundsRes.data.reduce((sum, g) => sum + parseInt(g.total_likes || 0), 0);
        
        const avgRatingSum = groundsRes.data.reduce((sum, g) => sum + parseFloat(g.average_rating || 0), 0);
        const avgRating = totalGrounds > 0 ? (avgRatingSum / totalGrounds).toFixed(1) : '0.0';

        setStats({
          totalGrounds,
          totalBookings,
          monthlyRevenue: monthlyRevenue.toFixed(2),
          totalLikes,
          avgRating
        });

        // Group revenue by Month for Recharts
        const revenueByMonth = {};
        bookingsRes.data
          .filter(b => b.payment_status === 'paid')
          .forEach(b => {
            const date = new Date(b.booking_date);
            const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            revenueByMonth[monthName] = (revenueByMonth[monthName] || 0) + parseFloat(b.amount);
          });

        const sortedChartData = Object.keys(revenueByMonth).map(month => ({
          month,
          revenue: revenueByMonth[month]
        }));
        setChartData(sortedChartData);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      
      {/* Header and Add Ground */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Owner Dashboard</h1>
          <p className="text-sm text-slate-400">Manage your sports arenas, view bookings and track earnings</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/owner/tournaments/new"
            className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Trophy className="h-4.5 w-4.5" /> Host Tournament
          </Link>
          <Link 
            to="/owner/add-ground"
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <PlusCircle className="h-4.5 w-4.5" /> Add New Ground
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Grounds */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Grounds</span>
          <p className="text-2xl font-extrabold text-white">{stats.totalGrounds}</p>
        </div>

        {/* Bookings */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Bookings</span>
          <p className="text-2xl font-extrabold text-white">{stats.totalBookings}</p>
        </div>

        {/* Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Revenue</span>
          <p className="text-2xl font-extrabold text-emerald-400">₹{parseFloat(stats.monthlyRevenue).toFixed(0)}</p>
        </div>

        {/* Likes */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500">Likes Received</span>
          <p className="text-2xl font-extrabold text-red-400">{stats.totalLikes}</p>
        </div>

        {/* Rating */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl col-span-2 md:col-span-1 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-500">Average Rating</span>
          <p className="text-2xl font-extrabold text-amber-400">{stats.avgRating} <span className="text-xs font-normal text-slate-550">/ 5.0</span></p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-base">Monthly Revenue Breakdown</h3>
          {chartData.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-20">No revenue data available yet</p>
          ) : (
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Booking Distribution */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">Ground Status Monitor</h3>
            <div className="space-y-3">
              {grounds.map(g => (
                <div key={g.id} className="flex justify-between items-center text-xs pb-3 border-b border-slate-850 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{g.name}</span>
                    {g.status === 'draft' && (
                      <Link to={`/owner/add-ground?resume=${g.id}`} className="text-[#22c55e] text-[10px] mt-1 hover:underline">
                        Complete Setup
                      </Link>
                    )}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    g.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    g.status === 'pending_verification' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-slate-950 text-slate-500 border border-slate-800'
                  }`}>
                    {g.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-850 pt-4">
            <Link 
              to="/owner/grounds"
              className="text-emerald-400 hover:text-emerald-350 font-bold text-xs flex items-center justify-center gap-1 hover:underline cursor-pointer"
            >
              View My Grounds List
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
