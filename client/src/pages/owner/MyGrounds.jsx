import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PlusCircle, Clock, CheckCircle2, XCircle, AlertTriangle, Eye, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyGrounds() {
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyGrounds = () => {
    setLoading(true);
    axios.get('/api/owner/grounds')
      .then(res => {
        setGrounds(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load your grounds');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMyGrounds();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">My Arenas & Grounds</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track verification status, configure slots, and manage arenas submitted for admin review.
          </p>
        </div>
        <Link 
          to="/owner/add-ground"
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> Add New Ground
        </Link>
      </div>

      {/* Info notice about Admin Approval */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <span className="font-bold text-white block">100% Admin Verified Arena Policy</span>
          <p className="text-slate-400 leading-relaxed">
            All newly added arenas undergo manual admin review. Once approved by the administrator, your arena automatically becomes visible in public search and opens immediately for user bookings.
          </p>
        </div>
      </div>

      {/* Grounds Grid */}
      {grounds.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-4">
          <p className="text-slate-400 font-medium">You haven't added any sports arenas yet.</p>
          <Link 
            to="/owner/add-ground"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" /> Register Your First Ground
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grounds.map(ground => {
            const isApproved = ground.status === 'approved';
            const isPending = ground.status === 'pending' || ground.status === 'pending_verification';
            const isRejected = ground.status === 'rejected';

            return (
              <div 
                key={ground.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden flex flex-col justify-between transition group shadow-xl"
              >
                <div>
                  {/* Image banner with status badge */}
                  <div className="relative aspect-[16/9] bg-slate-950 overflow-hidden">
                    <img 
                      src={ground.main_photo || '/uploads/default-main.jpg'} 
                      alt={ground.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      {isApproved && (
                        <span className="bg-emerald-500/90 backdrop-blur-md text-slate-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                          <CheckCircle2 className="h-3 w-3" /> Live & Approved
                        </span>
                      )}
                      {isPending && (
                        <span className="bg-amber-500/90 backdrop-blur-md text-slate-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                          <Clock className="h-3 w-3" /> Pending Admin Review
                        </span>
                      )}
                      {isRejected && (
                        <span className="bg-red-500/90 backdrop-blur-md text-white font-black text-[10px] uppercase px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                          <XCircle className="h-3 w-3" /> Rejected
                        </span>
                      )}
                      {!isApproved && !isPending && !isRejected && (
                        <span className="bg-slate-800/90 backdrop-blur-md text-slate-300 font-black text-[10px] uppercase px-2.5 py-1 rounded-lg flex items-center gap-1">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">{ground.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {ground.address || ground.city || 'Chennai'} {ground.district_name ? `• ${ground.district_name}` : ''}
                      </p>
                    </div>

                    {/* Sports Tags */}
                    {ground.sports && ground.sports.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ground.sports.map((s, idx) => (
                          <span key={idx} className="bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {typeof s === 'object' ? s.name : s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pending explanation */}
                    {isPending && (
                      <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-[11px] text-amber-300 leading-normal flex items-start gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>Submitted for verification. Administrator review is underway.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action buttons */}
                <div className="p-5 pt-0 border-t border-slate-850 flex items-center gap-2 mt-4">
                  {isApproved ? (
                    <>
                      <Link 
                        to={`/grounds/${ground.id}`}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl text-xs text-center transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-400" /> View Live
                      </Link>
                      <Link 
                        to="/owner/slots"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-3 rounded-xl text-xs text-center transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
                      >
                        <Calendar className="h-3.5 w-3.5" /> Manage Slots
                      </Link>
                    </>
                  ) : (
                    <button 
                      disabled
                      className="w-full bg-slate-800/50 text-slate-500 font-semibold py-2 px-3 rounded-xl text-xs text-center cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      <Clock className="h-3.5 w-3.5" /> Booking opens upon admin approval
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
