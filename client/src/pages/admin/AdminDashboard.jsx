import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ShieldCheck, UserCheck, Activity, Users, DollarSign, Calendar, AlertTriangle, ShieldAlert, Trophy, MapPin, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [pendingTournaments, setPendingTournaments] = useState([]);
  const [allGrounds, setAllGrounds] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Ground State
  const [editGroundModalOpen, setEditGroundModalOpen] = useState(false);
  const [editGroundForm, setEditGroundForm] = useState({ id: null, name: '', description: '' });

  const loadData = async () => {
    try {
      setLoading(true);
      const statsRes = await axios.get('/api/admin/stats');
      const usersRes = await axios.get('/api/admin/users');
      const tournamentsRes = await axios.get('/api/tournaments/admin');
      const groundsRes = await axios.get('/api/admin/grounds');
      const reportsRes = await axios.get('/api/reports');
      
      setStats(statsRes.data);
      setUsersList(usersRes.data);
      setPendingTournaments(tournamentsRes.data);
      setAllGrounds(groundsRes.data);
      setReports(reportsRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load admin dashboard statistics');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSuspend = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    const actionWord = nextStatus === 'suspended' ? 'suspend' : 'unsuspend';
    
    if (!window.confirm(`Are you sure you want to ${actionWord} this account?`)) return;

    try {
      await axios.patch(`/api/admin/users/${userId}/suspend`, { status: nextStatus });
      toast.success(`Account successfully ${nextStatus === 'suspended' ? 'suspended' : 'activated'}`);
      
      // Update local state
      setUsersList(prev =>
        prev.map(u => (u.id === userId ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Moderation action failed');
    }
  };

  const handleCancelGroundApproval = async (groundId, groundName) => {
    const reason = window.prompt(`Please enter the reason for cancelling approval for "${groundName}":`, 'Quality standards / Policy violation');
    if (reason === null) return; // Cancelled prompt

    try {
      await axios.patch(`/api/admin/grounds/${groundId}/cancel-approval`, { reason, status: 'rejected' });
      toast.success(`Approval cancelled for "${groundName}". Ground is no longer public.`);
      setAllGrounds(prev =>
        prev.map(g => (g.id === groundId ? { ...g, status: 'rejected' } : g))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel approval');
    }
  };

  const handleApproveGround = async (groundId, groundName) => {
    try {
      await axios.patch(`/api/admin/grounds/${groundId}/approve`);
      toast.success(`"${groundName}" approved and live!`);
      setAllGrounds(prev =>
        prev.map(g => (g.id === groundId ? { ...g, status: 'approved' } : g))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve ground');
    }
  };

  const handleDismissReport = async (reportId) => {
    try {
      await axios.delete(`/api/admin/reports/${reportId}`);
      toast.success('Report dismissed successfully');
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dismiss report');
    }
  };

  const handleToggleGroundSuspend = async (groundId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' || currentStatus === 'banned' ? 'approved' : 'banned';
    const actionWord = nextStatus === 'banned' ? 'ban' : 'unban';
    
    if (!window.confirm(`Are you sure you want to ${actionWord} this ground?`)) return;

    try {
      await axios.patch(`/api/admin/grounds/${groundId}/suspend`, { status: nextStatus });
      toast.success(`Ground successfully ${nextStatus === 'banned' ? 'banned' : 'activated'}`);
      
      // Update local state
      setAllGrounds(prev =>
        prev.map(g => (g.id === groundId ? { ...g, status: nextStatus } : g))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Moderation action failed');
    }
  };

  const handleTournamentAction = async (id, status) => {
    try {
      await axios.patch(`/api/tournaments/${id}/status`, { status });
      toast.success(`Tournament ${status}`);
      setPendingTournaments(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleOpenEditModal = (ground) => {
    setEditGroundForm({ id: ground.id, name: ground.name, description: ground.description });
    setEditGroundModalOpen(true);
  };

  const handleEditGroundSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/grounds/${editGroundForm.id}`, {
        name: editGroundForm.name,
        description: editGroundForm.description
      });
      toast.success('Ground details updated successfully');
      setAllGrounds(prev => prev.map(g => (g.id === editGroundForm.id ? { ...g, name: editGroundForm.name, description: editGroundForm.description } : g)));
      setEditGroundModalOpen(false);
    } catch (err) {
      toast.error('Failed to update ground details');
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">System Admin Console</h1>
          <p className="text-sm text-slate-400">Moderator hub: manage user accounts, approve turf registrations, monitor revenues</p>
        </div>
        <Link 
          to="/admin/verify"
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
        >
          <AlertTriangle className="h-4.5 w-4.5" /> Check Pending Grounds ({stats.pendingApprovals})
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500">Players</span>
          <p className="text-xl font-extrabold text-white">{stats.totalUsers}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500">Owners</span>
          <p className="text-xl font-extrabold text-white">{stats.totalOwners}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Arenas</span>
          <p className="text-xl font-extrabold text-white">{stats.totalGrounds}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500">Pending Approvals</span>
          <p className="text-xl font-extrabold text-amber-400">{stats.pendingApprovals}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Bookings</span>
          <p className="text-xl font-extrabold text-white">{stats.totalBookings}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl col-span-2 md:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Earnings</span>
          <p className="text-xl font-extrabold text-emerald-400">₹{parseFloat(stats.totalRevenue).toFixed(0)}</p>
        </div>

      </div>

      {/* Grid: Charts and Verifications overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recharts Area Graph */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h3 className="font-bold text-white text-base">Monthly Booking Sales</h3>
          {(!stats.monthlyRevenue || stats.monthlyRevenue.length === 0) ? (
            <p className="text-xs text-slate-500 text-center py-20">No transaction data available yet</p>
          ) : (
            <div className="h-60 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyRevenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                    labelStyle={{ color: '#white', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Action Panel shortcuts */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-base">Quick Reminders</h3>
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Verification queue:</span>
                <span className="text-amber-400 font-bold">{stats.pendingApprovals} Arenas</span>
              </div>
              <div className="flex justify-between border-t border-slate-850 pt-2.5 mt-2.5">
                <span>Active grounds count:</span>
                <span className="text-white">{stats.totalGrounds - stats.pendingApprovals} Approved</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-850 pt-4 flex flex-col gap-2">
            <Link 
              to="/admin/verify"
              className="w-full text-center bg-slate-950 hover:bg-slate-850 text-emerald-400 font-bold py-2 rounded-xl text-xs border border-slate-800 transition"
            >
              Verify Turf Requests
            </Link>
          </div>
        </div>

      </div>

      {/* Ground Owners Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-500" /> Ground Owner Accounts
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3 rounded-l-lg">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {usersList.filter(u => u.role === 'owner').length === 0 && (
                <tr><td colSpan="5" className="text-center py-6 text-slate-500">No ground owners found</td></tr>
              )}
              {usersList.filter(u => u.role === 'owner').map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4 font-bold text-white">{usr.name}</td>
                  <td className="px-6 py-4">{usr.email}</td>
                  <td className="px-6 py-4 font-mono">{usr.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${usr.status === 'suspended' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {usr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggleSuspend(usr.id, usr.status)}
                      className={`font-bold px-3 py-1 rounded transition cursor-pointer text-[10px] ${usr.status === 'suspended' ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/15 text-red-400 hover:bg-red-500/30'}`}
                    >
                      {usr.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Users className="h-5 w-5 text-emerald-500" /> Player Accounts
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3 rounded-l-lg">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {usersList.filter(u => u.role === 'user').length === 0 && (
                <tr><td colSpan="5" className="text-center py-6 text-slate-500">No players found</td></tr>
              )}
              {usersList.filter(u => u.role === 'user').map((usr) => (
                <tr key={usr.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4 font-bold text-white">{usr.name}</td>
                  <td className="px-6 py-4">{usr.email}</td>
                  <td className="px-6 py-4 font-mono">{usr.phone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${usr.status === 'suspended' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {usr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleToggleSuspend(usr.id, usr.status)}
                      className={`font-bold px-3 py-1 rounded transition cursor-pointer text-[10px] ${usr.status === 'suspended' ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/15 text-red-400 hover:bg-red-500/30'}`}
                    >
                      {usr.status === 'suspended' ? 'Activate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Tournaments Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Trophy className="h-5 w-5 text-emerald-500" /> Pending Tournaments
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3 rounded-l-lg">Tournament Name</th>
                <th className="px-6 py-3">Ground</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Dates</th>
                <th className="px-6 py-3 rounded-r-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {pendingTournaments.length === 0 && (
                <tr><td colSpan="5" className="text-center py-6 text-slate-500">No pending tournaments</td></tr>
              )}
              {pendingTournaments.map((t) => (
                <tr key={t.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4 font-bold text-white">{t.name}</td>
                  <td className="px-6 py-4">{t.ground_name}</td>
                  <td className="px-6 py-4">{t.owner_name}</td>
                  <td className="px-6 py-4 font-mono">{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end">
                    <button 
                      onClick={() => handleTournamentAction(t.id, 'approved')}
                      className="font-bold px-3 py-1 rounded transition cursor-pointer text-[10px] bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleTournamentAction(t.id, 'rejected')}
                      className="font-bold px-3 py-1 rounded transition cursor-pointer text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/30"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grounds Management Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-500" /> Grounds Management & Approval Control
          </h3>
          <span className="text-xs text-slate-400">Total: {allGrounds.length} Arenas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3 rounded-l-lg">Ground Name</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 rounded-r-lg text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {allGrounds.length === 0 && (
                <tr><td colSpan="5" className="text-center py-6 text-slate-500">No grounds found</td></tr>
              )}
              {allGrounds.map((g) => (
                <tr key={g.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4">
                    <Link to={`/grounds/${g.id}`} className="font-bold text-white hover:text-emerald-400 transition">
                      {g.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div>{g.owner_name}</div>
                    <div className="text-[10px] text-slate-500">{g.owner_email}</div>
                  </td>
                  <td className="px-6 py-4">{g.city}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide border ${
                      g.status === 'approved' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                        : g.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {g.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end items-center">
                    <button 
                      onClick={() => handleOpenEditModal(g)}
                      className="font-bold px-2.5 py-1 rounded transition cursor-pointer text-[10px] bg-blue-500/15 text-blue-400 hover:bg-blue-500/30 flex items-center gap-1"
                      title="Edit Ground Info"
                    >
                      <Edit className="h-3 w-3" /> Edit
                    </button>
                    
                    {g.status === 'approved' ? (
                      <button 
                        onClick={() => handleCancelGroundApproval(g.id, g.name)}
                        className="font-bold px-3 py-1 rounded transition cursor-pointer text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30 shadow-sm"
                        title="Cancel/Revoke Approval and take offline"
                      >
                        Cancel Approval
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleApproveGround(g.id, g.name)}
                        className="font-bold px-3 py-1 rounded transition cursor-pointer text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 border border-emerald-500/30 shadow-sm"
                        title="Approve Ground & make live"
                      >
                        Approve Ground
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" /> User Ground Reports & Feedback
          </h3>
          <span className="text-xs text-slate-400">Total: {reports.length} Reports</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-3 rounded-l-lg">Reporter</th>
                <th className="px-6 py-3">Reported Ground</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 rounded-r-lg text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {reports.length === 0 && (
                <tr><td colSpan="6" className="text-center py-6 text-slate-500">No active reports found</td></tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-850/30">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white">{r.reporter_name}</div>
                    <div className="text-[10px] text-slate-500">{r.reporter_email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/grounds/${r.ground_id}`} className="font-bold text-emerald-400 hover:underline">
                      {r.ground_name}
                    </Link>
                    {r.ground_status && (
                      <span className="ml-2 text-[9px] text-slate-400 uppercase font-semibold">({r.ground_status})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-red-400 font-semibold">{r.reason}</td>
                  <td className="px-6 py-4 text-slate-300 max-w-xs">{r.description}</td>
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right flex gap-2 justify-end items-center">
                    {r.ground_status === 'approved' && (
                      <button 
                        onClick={() => handleCancelGroundApproval(r.ground_id, r.ground_name)}
                        className="font-bold px-2.5 py-1 rounded transition cursor-pointer text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/40 border border-red-500/30"
                        title="Revoke/Cancel approval of this reported ground"
                      >
                        Revoke Approval
                      </button>
                    )}
                    <button 
                      onClick={() => handleDismissReport(r.id)}
                      className="font-bold px-2.5 py-1 rounded transition cursor-pointer text-[10px] bg-slate-800 text-slate-300 hover:bg-slate-700"
                      title="Dismiss report after investigation"
                    >
                      Dismiss
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Ground Modal */}
      {editGroundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Edit className="h-5 w-5 text-emerald-500" /> Edit Ground Details
            </h3>
            <form onSubmit={handleEditGroundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editGroundForm.name}
                  onChange={e => setEditGroundForm({ ...editGroundForm, name: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  required
                  rows="4"
                  value={editGroundForm.description}
                  onChange={e => setEditGroundForm({ ...editGroundForm, description: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditGroundModalOpen(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-350 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
