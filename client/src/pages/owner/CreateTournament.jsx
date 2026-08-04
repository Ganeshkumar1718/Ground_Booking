import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, Calendar, AlignLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function CreateTournament() {
  const [grounds, setGrounds] = useState([]);
  const [formData, setFormData] = useState({
    ground_id: '',
    name: '',
    start_date: '',
    end_date: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/api/owner/grounds')
      .then(res => {
        setGrounds(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, ground_id: res.data[0].id }));
        }
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ground_id || !formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/tournaments', formData);
      toast.success('Tournament submitted for Admin approval!');
      navigate('/owner/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-left">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold text-white">Host a Tournament</h1>
        <p className="text-sm text-slate-400">Create a tournament at your ground. Requires admin approval to go live.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h3 className="font-bold text-white text-base border-b border-slate-855 pb-3 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-emerald-500" /> Tournament Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 font-semibold mb-2">Select Ground</label>
            <select
              name="ground_id"
              value={formData.ground_id}
              onChange={handleChange}
              className="w-full bg-slate-950 text-slate-100 text-sm py-3 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {grounds.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 font-semibold mb-2">Tournament Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Summer Cup 2026"
              className="w-full bg-slate-950 text-slate-100 text-sm py-3 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 font-semibold mb-2 flex items-center gap-1"><Calendar className="h-4 w-4" /> Start Date</label>
              <input
                type="date"
                name="start_date"
                required
                value={formData.start_date}
                onChange={handleChange}
                className="w-full bg-slate-950 text-slate-100 text-sm py-3 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 font-semibold mb-2 flex items-center gap-1"><Calendar className="h-4 w-4" /> End Date</label>
              <input
                type="date"
                name="end_date"
                required
                value={formData.end_date}
                onChange={handleChange}
                className="w-full bg-slate-950 text-slate-100 text-sm py-3 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 font-semibold mb-2 flex items-center gap-1"><AlignLeft className="h-4 w-4" /> Description / Rules</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the tournament format, rules, prizes..."
              className="w-full h-32 bg-slate-950 text-slate-100 text-sm py-3 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
          ) : (
            <><ShieldCheck className="h-5 w-5" /> Submit for Admin Approval</>
          )}
        </button>
      </form>
    </div>
  );
}
