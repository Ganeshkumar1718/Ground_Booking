import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Star, Heart, MapPin, Calendar, Clock, CreditCard, ChevronRight, Activity, CornerDownRight, MessageSquare, AlertCircle, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';
import AIChatbox from '../components/AIChatbox';
import { API_URL } from '../config';

export default function GroundDetailsPage() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // State
  const [ground, setGround] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Likes State
  const [hasLiked, setHasLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newReviewText, setNewReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Comments State
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Payment Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ reason: '', description: '' });

  // Socket connection
  const selectedSlotRef = React.useRef(selectedSlot);
  
  useEffect(() => {
    selectedSlotRef.current = selectedSlot;
  }, [selectedSlot]);

  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true, transports: ['websocket', 'polling'] });

    socket.on('slotStatusUpdated', (data) => {
      // If the slot that got updated belongs to this ground, update local state
      setSlots(prev =>
        prev.map(slot =>
          slot.id === data.slotId ? { ...slot, status: data.status } : slot
        )
      );
      const currentSelected = selectedSlotRef.current;
      if (currentSelected && currentSelected.id === data.slotId && data.status !== 'available') {
        if (!user || data.userId !== user.id) {
          setSelectedSlot(null);
          toast.error('The selected slot was just booked by another user!');
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, id]); // Connect once per page load/user change

  // Load ground details
  useEffect(() => {
    setLoading(true);
    axios.get(`/api/grounds/${id}`)
      .then(res => {
        setGround(res.data);
        setLikesCount(res.data.total_likes);
        if (res.data.sports && res.data.sports.length > 0) {
          setSelectedSport(res.data.sports[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to load ground details');
        setLoading(false);
      });

    // Load reviews
    axios.get(`/api/grounds/${id}/reviews`)
      .then(res => setReviews(res.data))
      .catch(err => console.error(err));

    // Load comments
    axios.get(`/api/grounds/${id}/comments`)
      .then(res => setComments(res.data))
      .catch(err => console.error(err));
  }, [id]);

  // Load slots dynamically based on sport + date
  useEffect(() => {
    if (selectedSport && selectedDate) {
      axios.get('/api/slots', {
        params: {
          ground_id: id,
          sport_id: selectedSport.id,
          booking_date: selectedDate
        }
      })
      .then(res => {
        setSlots(res.data);
        setSelectedSlot(null);
      })
      .catch(err => {
        console.error('Error fetching slots:', err);
      });
    }
  }, [id, selectedSport, selectedDate]);

  // Check if current user likes this ground
  useEffect(() => {
    if (user && ground) {
      // Query likes list or use mock toggle verification
      // For this full-stack example, we'll fetch from a simulated config or do a quick check
      // Simple implementation: standard likes fetch could verify.
      // We will assume likes details are managed. Let's make likes toggle optimistic.
    }
  }, [user, ground]);

  const handleLikeToggle = async () => {
    if (!user) {
      toast.error('Please log in to like this arena');
      return;
    }

    // Optimistic UI updates
    const prevLiked = hasLiked;
    const prevCount = likesCount;
    
    setHasLiked(!prevLiked);
    setLikesCount(prev => prevLiked ? prev - 1 : prev + 1);

    try {
      if (prevLiked) {
        await axios.delete(`/api/grounds/${id}/like`);
      } else {
        await axios.post(`/api/grounds/${id}/like`);
      }
    } catch (err) {
      // Rollback
      setHasLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(err.response?.data?.message || 'Error updating like');
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to post a comment');
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      const res = await axios.post(`/api/grounds/${id}/comments`, { comment: newCommentText });
      setComments(prev => [...prev, res.data]);
      setNewCommentText('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error('Error posting comment');
    }
  };

  const handlePostReply = async (e, parentId) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to reply');
      return;
    }
    if (!replyText.trim()) return;

    try {
      const res = await axios.post(`/api/grounds/${id}/comments`, {
        comment: replyText,
        parent_comment_id: parentId
      });

      // Update tree hierarchy in state
      setComments(prev =>
        prev.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), res.data] };
          }
          return c;
        })
      );

      setReplyText('');
      setReplyingToId(null);
      toast.success('Reply posted!');
    } catch (err) {
      toast.error('Error posting reply');
    }
  };

  const handleInitBooking = async () => {
    if (!user) {
      toast.error('Please log in to book a slot');
      navigate('/login');
      return;
    }

    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    try {
      const res = await axios.post('/api/bookings', { slot_id: selectedSlot.id });
      setBookingDetails(res.data);
      setCheckoutModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error initializing booking');
    }
  };

  const handleCompletePayment = async (simulatedStatus) => {
    if (!bookingDetails) return;
    setProcessingPayment(true);

    try {
      const res = await axios.post(`/api/bookings/${bookingDetails.bookingId}/pay`, {
        status: simulatedStatus
      });

      setProcessingPayment(false);
      setCheckoutModalOpen(false);

      if (simulatedStatus === 'success') {
        toast.success('Booking confirmed! Slot reserved successfully.');
        navigate('/user/bookings');
      } else {
        toast.error('Payment simulation failed.');
      }
    } catch (err) {
      setProcessingPayment(false);
      toast.error('Payment confirmation error');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to report a ground');
      navigate('/login');
      return;
    }
    if (!reportForm.reason || !reportForm.description) {
      toast.error('Please provide a reason and description');
      return;
    }
    
    try {
      await axios.post(`/api/reports/ground/${id}`, reportForm);
      toast.success('Report submitted successfully. Moderation team has been alerted.');
      setReportModalOpen(false);
      setReportForm({ reason: '', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting report');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to submit a review');
      navigate('/login');
      return;
    }
    if (!newReviewText.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setSubmittingReview(true);
    try {
      await axios.post(`/api/grounds/${id}/reviews`, {
        rating: newRating,
        review_text: newReviewText.trim()
      });
      toast.success('Thank you! Your review has been published.');
      setNewReviewText('');
      setNewRating(5);
      
      // Refresh reviews and ground info
      const [revRes, groundRes] = await Promise.all([
        axios.get(`/api/grounds/${id}/reviews`),
        axios.get(`/api/grounds/${id}`)
      ]);
      setReviews(revRes.data);
      if (groundRes.data.average_rating) {
        setGround(prev => ({ ...prev, average_rating: groundRes.data.average_rating }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting review');
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

  if (!ground) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-slate-500">
        Ground details could not be found.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 text-left">
      
      {/* Visual Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gallery Carousel & Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Photo Card */}
          <div className="aspect-video w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative">
            <img 
              src={ground.main_photo || API_URL + '/uploads/default-main.jpg'} 
              alt={ground.name} 
              className="h-full w-full object-cover"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={handleLikeToggle}
                className="bg-slate-950/80 border border-slate-800 text-slate-100 hover:text-red-400 p-2.5 rounded-full transition flex items-center gap-1 cursor-pointer"
              >
                <Heart className={`h-5 w-5 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-xs font-bold">{likesCount}</span>
              </button>
            </div>
          </div>

          {/* Photo Gallery Grid */}
          {ground.photos && ground.photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {ground.photos.slice(0, 5).map((photo, idx) => (
                <div key={idx} className="aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
                  <img 
                    src={photo.photo_url.startsWith('http') ? photo.photo_url : `${API_URL}${photo.photo_url}`}
                    alt={`Gallery ${idx + 1}`} 
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Ground Descriptions */}
          <div className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-white">{ground.name}</h1>
                <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                  {ground.address}, {ground.city}, {ground.state}
                </p>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-3 py-1.5 rounded-lg text-sm">
                <Star className="h-4 w-4 fill-amber-400" />
                <span>{parseFloat(ground.average_rating || 0).toFixed(1)}</span>
              </div>
              <button
                onClick={() => setReportModalOpen(true)}
                className="flex items-center gap-1 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-bold px-3 py-1.5 rounded-lg text-sm transition"
                title="Report Arena"
              >
                <Flag className="h-4 w-4" />
              </button>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <h3 className="font-bold text-white mb-2 text-sm uppercase tracking-wider">Description</h3>
              <p className="text-sm text-slate-350 leading-relaxed">{ground.description}</p>
            </div>

            <div className="border-t border-slate-800 pt-4 grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>
                <span className="block text-slate-500">Contact Email:</span>
                <span className="text-slate-200">{ground.owner_email}</span>
              </div>
              <div>
                <span className="block text-slate-500">Contact Phone:</span>
                <span className="text-slate-200">{ground.owner_phone}</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Slot Picker & Booking Card */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl sticky top-24">
            
            <h3 className="font-bold text-white text-base pb-3 border-b border-slate-850 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" /> Book Arena Slot
            </h3>

            {/* Sport Picker */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">1. Select Sport</label>
              <div className="flex flex-wrap gap-2">
                {ground.sports && ground.sports.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setSelectedSport(s)}
                    className={`py-2 px-4 rounded-xl text-xs font-semibold border transition cursor-pointer ${selectedSport?.id === s.id ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Calendar Picker */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">2. Select Date</label>
              <input 
                type="date" 
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>

            {/* Time Slot Picker Grid */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">3. Available Slots</label>
              {slots.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 bg-slate-950/40 rounded-xl text-center border border-slate-850">
                  No slots available on this date.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {slots.map(slot => {
                    const isBooked = slot.status === 'booked';
                    const isBlocked = slot.status === 'blocked';
                    const isSelected = selectedSlot?.id === slot.id;

                    return (
                      <button 
                        key={slot.id}
                        disabled={isBooked || isBlocked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                          isBooked ? 'bg-red-500/10 border-red-500/20 text-red-500/40 cursor-not-allowed opacity-50' : 
                          isBlocked ? 'bg-slate-800 border-slate-800 text-slate-500 cursor-not-allowed' :
                          isSelected ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold' :
                          'bg-slate-950 border-slate-850 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-[11px] font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        <span className="text-[10px] mt-0.5 text-slate-400">
                          ₹{parseFloat(slot.price).toFixed(0)}/{ground.price_type === 'match' ? 'match' : 'hr'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            {selectedSlot && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Selected Slot:</span>
                  <span className="text-white font-bold">{selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Booking Amount:</span>
                  <span className="text-emerald-400 font-bold text-sm">₹{parseFloat(selectedSlot.price).toFixed(0)}</span>
                </div>
              </div>
            )}

            {/* Book Now Button */}
            <button 
              onClick={handleInitBooking}
              disabled={!selectedSlot}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <CreditCard className="h-4.5 w-4.5" /> Book Arena Slot
            </button>

          </div>
        </div>

      </div>

      {/* Nested Comments & Reviews Tab Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Comments Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="font-bold text-white text-base border-b border-slate-850 pb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" /> Discussion Board
          </h3>

          {/* New comment input */}
          <form onSubmit={handlePostComment} className="flex gap-2">
            <input 
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Ask a question about this arena..."
              className="flex-1 bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-850 focus:outline-none focus:border-emerald-500"
            />
            <button 
              type="submit" 
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
            >
              Post
            </button>
          </form>

          {/* Comments tree */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">No queries posted yet. Start the conversation!</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="space-y-3 bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                  
                  {/* Root Comment */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 leading-none">
                        <span className="font-bold text-slate-200">{c.user_name}</span>
                        {c.user_role === 'owner' && <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 px-1 py-0.5 rounded text-[8px] font-bold">Owner</span>}
                        <span>•</span>
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5">{c.comment}</p>
                    </div>
                    
                    <button 
                      onClick={() => setReplyingToId(c.id)}
                      className="text-[10px] text-emerald-400 hover:underline cursor-pointer"
                    >
                      Reply
                    </button>
                  </div>

                  {/* Replies List */}
                  {c.replies && c.replies.map(r => (
                    <div key={r.id} className="ml-6 pl-4 border-l border-slate-800 flex gap-2 pt-2">
                      <CornerDownRight className="h-4.5 w-4.5 text-slate-650 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 leading-none">
                          <span className="font-bold text-slate-200">{r.user_name}</span>
                          {r.user_role === 'owner' && <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/10 px-1.5 py-0.5 rounded text-[8px] font-bold">Owner</span>}
                          <span>•</span>
                          <span>{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-350 mt-1">{r.comment}</p>
                      </div>
                    </div>
                  ))}

                  {/* Reply Input */}
                  {replyingToId === c.id && (
                    <form onSubmit={(e) => handlePostReply(e, c.id)} className="ml-6 flex gap-2 mt-2">
                      <input 
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a response..."
                        className="flex-1 bg-slate-950 text-slate-100 text-[11px] py-1.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                      />
                      <button 
                        type="submit" 
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[10px] transition cursor-pointer"
                      >
                        Reply
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setReplyingToId(null)}
                        className="text-slate-500 text-[10px] px-1 hover:underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </form>
                  )}

                </div>
              ))
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-850 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Star className="h-5 w-5 text-emerald-500 fill-emerald-500/20" /> Player Reviews & Ratings
            </h3>
            <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 font-semibold">
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>

          {/* Write a Review Card */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Rate Your Experience:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition transform hover:scale-125 cursor-pointer focus:outline-none"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        (hoverRating || newRating) >= star
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-[11px] font-bold text-amber-400 ml-1">
                  {hoverRating || newRating} / 5
                </span>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-2">
              <textarea
                rows="2"
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                placeholder="Write your feedback about turf quality, amenities, lighting, etc..."
                className="w-full bg-slate-900 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-500/10"
                >
                  {submittingReview ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>

          {/* Reviews List */}
          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            {reviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <AlertCircle className="h-8 w-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-400 font-semibold">No reviews published yet.</p>
                <p className="text-[11px] text-slate-600">Be the first to share your match experience!</p>
              </div>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold text-slate-200 text-xs">{r.user_name}</span>
                    <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">"{r.review_text}"</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* checkout payment simulation modal */}
      {checkoutModalOpen && bookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            {/* Header */}
            <div className="text-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-center">
                <CreditCard className="h-5 w-5 text-emerald-500" /> Checkout & Payment
              </h3>
              <p className="text-xs text-slate-400 mt-1">Simulated Secure Payment Gateway</p>
            </div>

            {/* Info */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 text-xs text-slate-350">
              <div className="flex justify-between">
                <span>Ground:</span>
                <span className="text-white font-bold">{ground.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Booking Date:</span>
                <span className="text-white">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Slot:</span>
                <span className="text-white font-mono">{selectedSlot.start_time.slice(0, 5)} - {selectedSlot.end_time.slice(0, 5)}</span>
              </div>
              <div className="flex justify-between">
                <span>Reference ID:</span>
                <span className="text-white font-mono">{bookingDetails.bookingRef}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-3">
                <span className="text-slate-400 font-bold">Total Amount:</span>
                <span className="text-slate-300 font-bold text-sm">₹{parseFloat(bookingDetails.amount).toFixed(0)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-3">
                <span className="text-slate-200 font-bold">Advance Payable Now ({ground.advance_percentage || 20}%):</span>
                <span className="text-emerald-400 font-bold text-base">₹{(parseFloat(bookingDetails.amount) * ((ground.advance_percentage || 20) / 100)).toFixed(0)}</span>
              </div>
            </div>

            {/* Simulator Warning */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2 items-start text-[11px] text-emerald-400">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <p>This is a simulated transaction. Clicking "Confirm Payment" locks the slot in the database and triggers owner notifications without real charges.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => setCheckoutModalOpen(false)}
                disabled={processingPayment}
                className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-350 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleCompletePayment('failed')}
                disabled={processingPayment}
                className="bg-red-500/10 border border-red-500/20 text-red-400 font-bold py-2.5 px-3 rounded-xl text-xs transition cursor-pointer"
              >
                Fail
              </button>
              <button 
                onClick={() => handleCompletePayment('success')}
                disabled={processingPayment}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10"
              >
                {processingPayment ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
                ) : (
                  'Confirm Payment'
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Flag className="h-5 w-5 text-red-500" /> Report Arena to Admin
            </h3>
            <p className="text-xs text-slate-400">
              Help us maintain fair and safe sports facilities. If you experienced any issue with this venue, please report below:
            </p>
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Reason for Report</label>
                <select
                  required
                  value={reportForm.reason}
                  onChange={e => setReportForm({ ...reportForm, reason: e.target.value })}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  <option value="">Select a reason</option>
                  <option value="Misleading Photos / Fake Info">Misleading Photos / Fake Info</option>
                  <option value="Safety Hazards / Poor Maintenance">Safety Hazards / Poor Maintenance</option>
                  <option value="Overcharging / Price Fraud">Overcharging / Price Fraud</option>
                  <option value="Host Cancellation / No-Show">Host Cancellation / No-Show</option>
                  <option value="Inappropriate or Offensive Behavior">Inappropriate or Offensive Behavior</option>
                  <option value="Other Policy Violation">Other Policy Violation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Detailed Description</label>
                <textarea
                  required
                  rows="3"
                  value={reportForm.description}
                  onChange={e => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full bg-slate-900 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-red-500"
                  placeholder="Explain what occurred (time, incident, unfair charges, etc.)..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-350 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Chatbox Widget */}
      <AIChatbox 
        ground={ground} 
        selectedSlot={selectedSlot} 
        selectedDate={selectedDate} 
        selectedSport={selectedSport} 
      />

    </div>
  );
}
