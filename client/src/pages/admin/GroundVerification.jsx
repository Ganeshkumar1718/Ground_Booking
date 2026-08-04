import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, XCircle, User, Phone, MapPin, Calendar, Clock, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GroundVerification() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'approved'
  const [pendingGrounds, setPendingGrounds] = useState([]);
  const [approvedGrounds, setApprovedGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Rejection / Revocation modal state
  const [rejectingGroundId, setRejectingGroundId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);
  const [modalMode, setModalMode] = useState('reject'); // 'reject' or 'revoke'

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/admin/pending-grounds'),
      axios.get('/api/admin/grounds')
    ])
      .then(([pendingRes, allRes]) => {
        setPendingGrounds(pendingRes.data);
        setApprovedGrounds(allRes.data.filter(g => g.status === 'approved'));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load verification queue');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this ground and make it visible to public search?')) return;
    try {
      await axios.patch(`/api/admin/grounds/${id}/approve`);
      toast.success('Ground approved successfully and live for bookings!');
      fetchData();
    } catch (err) {
      toast.error('Error approving ground');
    }
  };

  const handleOpenRejectModal = (id) => {
    setRejectingGroundId(id);
    setRejectReason('');
    setModalMode('reject');
    setRejectModalOpen(true);
  };

  const handleOpenRevokeModal = (id) => {
    setRejectingGroundId(id);
    setRejectReason('');
    setModalMode('revoke');
    setRejectModalOpen(true);
  };

  // Helper to compute distance offset
  const getDistanceOffset = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // meters
  };

  const handleDeletePhoto = async (groundId, photoId) => {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await axios.delete(`/api/grounds/${groundId}/photos`, { data: { photoId } });
      toast.success('Photo deleted');
      fetchPendingGrounds();
    } catch (err) {
      toast.error('Error deleting photo');
    }
  };

  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Please specify a reason');
      return;
    }

    setSubmittingReject(true);
    try {
      if (modalMode === 'revoke') {
        await axios.patch(`/api/admin/grounds/${rejectingGroundId}/cancel-approval`, {
          reason: rejectReason,
          status: 'rejected'
        });
        toast.success('Ground approval revoked. Arena taken offline.');
      } else {
        await axios.patch(`/api/admin/grounds/${rejectingGroundId}/reject`, {
          reason: rejectReason
        });
        toast.success('Ground verification rejected. Owner notified.');
      }
      setRejectModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing request');
    } finally {
      setSubmittingReject(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const currentList = activeTab === 'pending' ? pendingGrounds : approvedGrounds;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Ground Verification & Approval</h1>
          <p className="text-sm text-slate-400">Review arena registrations, inspect site photos, and manage ground approval status</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Review
            {pendingGrounds.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'pending' ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {pendingGrounds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Approved Arenas
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'approved' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
              {approvedGrounds.length}
            </span>
          </button>
        </div>
      </div>

      {currentList.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          {activeTab === 'pending' 
            ? 'The verification queue is clean. No pending ground requests.' 
            : 'No approved grounds currently active.'}
        </div>
      ) : (
        <div className="space-y-8">
          {currentList.map(ground => (
            <div 
              key={ground.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 hover:border-slate-700 transition"
            >
              
              {/* Info Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-850">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">{ground.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      ground.status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {ground.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                    {ground.address}, {ground.city}, {ground.state}
                  </p>
                  {ground.latitude && (
                    <p className="text-[10px] text-slate-500 font-mono">GPS Regist: {ground.latitude}, {ground.longitude}</p>
                  )}
                </div>

                {/* Owner details */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs text-slate-350 space-y-1.5 max-w-sm w-full">
                  <span className="block text-slate-500 font-bold uppercase text-[9px] tracking-wider">Owner Details</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-200">
                    <User className="h-3.5 w-3.5 text-slate-500" /> {ground.owner_name}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px]">
                    <Phone className="h-3.5 w-3.5 text-slate-500" /> {ground.owner_phone}
                  </div>
                </div>
              </div>

              {/* Details & Sports */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-350">
                <div className="md:col-span-2 space-y-1">
                  <span className="block text-slate-500 font-bold">Details Description</span>
                  <p className="text-slate-200 leading-relaxed italic">"{ground.description || 'No description provided'}"</p>
                </div>
                <div className="space-y-1.5">
                  <span className="block text-slate-500 font-bold">Selected Sports</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {ground.sports && ground.sports.map((s, idx) => (
                      <span key={idx} className="bg-slate-950 px-2.5 py-1 border border-slate-850 text-slate-300 font-semibold rounded-lg text-[10px]">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photos Gallery Verification Section */}
              {ground.photos && ground.photos.length > 0 && (
                <div className="space-y-3">
                  <span className="block text-slate-500 font-bold text-xs">Verification Photos ({ground.photos.length})</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    {ground.photos.map((photo) => {
                      const dist = photo.latitude && ground.latitude ? getDistanceOffset(
                        parseFloat(photo.latitude),
                        parseFloat(photo.longitude),
                        parseFloat(ground.latitude),
                        parseFloat(ground.longitude)
                      ) : 0;
                      const isOffsetWarning = dist > 500;

                      return (
                        <div key={photo.id} className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl space-y-2 text-[10px] flex flex-col justify-between">
                          <div>
                            <div className="aspect-video w-full rounded overflow-hidden bg-slate-900 relative">
                              <img 
                                src={(photo.image_url || photo.photo_url)?.startsWith('http') ? (photo.image_url || photo.photo_url) : (photo.image_url || photo.photo_url || '/uploads/default-main.jpg')} 
                                alt="Capture" 
                                className="h-full w-full object-cover" 
                              />
                              <button
                                onClick={() => handleDeletePhoto(ground.id, photo.id)}
                                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full cursor-pointer"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </div>
                            
                            {photo.latitude && (
                              <div className="space-y-1 mt-2 text-slate-400">
                                <span className="block text-slate-500 font-bold">Coordinates:</span>
                                <span className="font-mono block text-slate-300">{parseFloat(photo.latitude).toFixed(4)}, {parseFloat(photo.longitude).toFixed(4)}</span>
                              </div>
                            )}
                          </div>

                          {photo.latitude && (
                            <div className={`mt-2 border p-1.5 rounded-lg flex items-start gap-1 leading-normal ${
                              isOffsetWarning ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              <div>
                                <span className="block font-bold">{isOffsetWarning ? 'Gps Warning' : 'Location Ok'}</span>
                                <span>{Math.round(dist)}m offset</span>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Panels */}
              <div className="flex gap-4 pt-4 border-t border-slate-850">
                {ground.status === 'approved' ? (
                  <button 
                    onClick={() => handleOpenRevokeModal(ground.id)}
                    className="w-full bg-red-500/15 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <XCircle className="h-4.5 w-4.5" /> Cancel / Revoke Ground Approval
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={() => handleOpenRejectModal(ground.id)}
                      className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-400 font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XCircle className="h-4.5 w-4.5" /> Reject Registration
                    </button>
                    <button 
                      onClick={() => handleApprove(ground.id)}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      <CheckCircle className="h-4.5 w-4.5" /> Approve Turf Hub & Make Live
                    </button>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Rejection / Revocation Modal popup */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            <div className="text-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {modalMode === 'revoke' ? 'Cancel Ground Approval' : 'Rejection Specification'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {modalMode === 'revoke' 
                  ? 'Specify why this ground is being unapproved and taken offline'
                  : 'Specify feedback details explaining registration rejection'}
              </p>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">
                  {modalMode === 'revoke' ? 'Revocation Reason / Owner Notice' : 'Rejection Reason / Owner Feedback'}
                </label>
                <textarea 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={modalMode === 'revoke' 
                    ? "e.g. User reports confirmed safety violation / pitch degradation. Temporary revocation pending inspection."
                    : "e.g. Photo captured does not represent playing area. GPS coords offset is too high (1.5km)."}
                  className="w-full h-32 bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-850 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-350 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={submittingReject}
                  className="flex-1 bg-red-500 hover:bg-red-650 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center"
                >
                  {submittingReject ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  ) : (
                    modalMode === 'revoke' ? 'Confirm Revoke' : 'Confirm Reject'
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
