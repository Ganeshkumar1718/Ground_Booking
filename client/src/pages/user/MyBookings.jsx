import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Trash2, Edit3, ShieldAlert, Star, FileText, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../../config';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookings = () => {
    setLoading(true);
    axios.get('/api/bookings/my')
      .then(res => {
        setBookings(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load bookings list');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking and free the slot?')) return;
    
    try {
      const res = await axios.patch(`/api/bookings/${id}/cancel`);
      toast.success(res.data.message);
      fetchBookings(); // Reload list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cancelling booking');
    }
  };

  const handleOpenReviewModal = (booking) => {
    setSelectedBooking(booking);
    setRating(5);
    setReviewText('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    if (!reviewText.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      await axios.post(`/api/grounds/${selectedBooking.ground_id}/reviews`, {
        booking_id: selectedBooking.id,
        rating,
        review_text: reviewText
      });

      toast.success('Review submitted successfully!');
      setReviewModalOpen(false);
      fetchBookings(); // Reload to refresh rating status
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 text-left">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold text-white">My Arena Bookings</h1>
        <p className="text-sm text-slate-400">View matches list, request refunds, and write turf reviews</p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
          No bookings placed yet. Check the explore page to book courts.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookings.map(b => {
            const bookingDate = new Date(b.booking_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const isConfirmed = b.booking_status === 'confirmed';
            const isCancelled = b.booking_status === 'cancelled';
            const isPending = b.booking_status === 'pending';

            return (
              <div 
                key={b.id} 
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                {/* Header with Ground Image */}
                <div className="flex gap-4 items-start">
                  <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                    <img 
                      src={getImageUrl(b.main_photo || '/uploads/default-main.jpg')} 
                      alt={b.ground_name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] uppercase font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded-full">
                        {b.sport_name}
                      </span>
                      {/* Status Badges */}
                      <div className="flex flex-col items-end gap-1 text-[11px] font-bold">
                        {isConfirmed && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">Confirmed</span>}
                        {isCancelled && <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md">Cancelled</span>}
                        {isPending && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">Pending</span>}
                      </div>
                    </div>
                    <a href={`/ground/${b.ground_id}`} className="hover:text-emerald-400 transition">
                      <h3 className="font-bold text-base text-white truncate mt-1">{b.ground_name}</h3>
                    </a>
                    <p className="text-[11px] text-slate-400 truncate">{b.address}, {b.city}</p>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">REF: {b.booking_reference}</span>
                  </div>
                </div>

                {/* Logistics */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 border border-slate-850 p-3.5 rounded-xl text-slate-350">
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-semibold text-slate-500">Date</span>
                    <span className="text-white font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {bookingDate}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-semibold text-slate-500">Slot Time</span>
                    <span className="text-white font-medium flex items-center gap-1 font-mono">
                      <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {b.start_time.slice(0, 5)} - {b.end_time.slice(0, 5)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-semibold text-slate-500">Amount</span>
                    <span className="text-emerald-400 font-bold text-sm">₹{parseFloat(b.amount).toFixed(0)}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-semibold text-slate-500">Payment</span>
                    <span className="text-white capitalize font-medium">{b.payment_status}</span>
                  </div>
                </div>

                {/* Action panel */}
                <div className="flex gap-3 pt-1">
                  {/* Cancel Booking option */}
                  {isConfirmed && (
                    <button 
                      onClick={() => handleCancelBooking(b.id)}
                      className="flex-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-red-500 text-slate-400 hover:text-red-400 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" /> Cancel Match
                    </button>
                  )}

                  {/* Submit review option */}
                  {isConfirmed && (
                    <>
                      {b.review_id ? (
                        <span className="flex-1 bg-slate-950 border border-slate-850 text-slate-500 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-default">
                          <CheckCircle className="h-4 w-4 text-emerald-500" /> Reviewed
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleOpenReviewModal(b)}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 className="h-4 w-4" /> Write Review
                        </button>
                      )}
                    </>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal popup */}
      {reviewModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            <div className="text-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Write Turf Review</h3>
              <p className="text-xs text-slate-400 mt-1">Reviewing booking: {selectedBooking.ground_name}</p>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              
              {/* Stars rating selection */}
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Assign Rating Stars</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setRating(star)}
                      className="cursor-pointer transition hover:scale-110"
                    >
                      <Star className={`h-8 w-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Review Content</label>
                <textarea 
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details of your turf experience (pitch condition, lights, staff behaviour)..."
                  className="w-full h-28 bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-850 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-800 transition cursor-pointer"
                >
                  Close
                </button>
                <button 
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submittingReview ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                  ) : (
                    'Submit Review'
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
