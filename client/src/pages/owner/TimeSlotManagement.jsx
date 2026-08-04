import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Plus, Trash2, ShieldAlert, CheckCircle, Info, Lock, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TimeSlotManagement() {
  const [grounds, setGrounds] = useState([]);
  const [selectedGround, setSelectedGround] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState([]);

  // Slot generator form fields
  const [openingTime, setOpeningTime] = useState('06:00:00');
  const [closingTime, setClosingTime] = useState('22:00:00');
  const [slotDuration, setSlotDuration] = useState('1 hour');
  const [basePrice, setBasePrice] = useState('800');
  const [enableEveningPricing, setEnableEveningPricing] = useState(false);
  const [eveningPrice, setEveningPrice] = useState('1500');
  
  const [overs, setOvers] = useState('Unlimited');
  const [ballType, setBallType] = useState('Any Ball');

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Fetch owner grounds on load
  useEffect(() => {
    setLoading(true);
    axios.get('/api/owner/grounds')
      .then(res => {
        setGrounds(res.data);
        if (res.data.length > 0) {
          setSelectedGround(res.data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Update selected sport if ground changes
  useEffect(() => {
    if (selectedGround && selectedGround.sports && selectedGround.sports.length > 0) {
      setSelectedSport(selectedGround.sports[0]);
    } else {
      setSelectedSport(null);
    }
  }, [selectedGround]);

  const loadSlots = () => {
    if (selectedGround && selectedSport && selectedDate) {
      axios.get('/api/slots', {
        params: {
          ground_id: selectedGround.id,
          sport_id: selectedSport.id,
          booking_date: selectedDate
        }
      })
      .then(res => setSlots(res.data))
      .catch(err => console.error(err));
    }
  };

  // Reload slots when criteria changes
  useEffect(() => {
    loadSlots();
  }, [selectedGround, selectedSport, selectedDate]);

  const handleGenerateSlots = async (e) => {
    e.preventDefault();
    if (!selectedGround || !selectedSport) {
      toast.error('Please select ground and sport');
      return;
    }

    setGenerating(true);
    
    // Setup evening peak hour config
    const priceConfig = [];
    if (enableEveningPricing) {
      priceConfig.push({
        start: '17:00:00',
        end: '22:00:00',
        price: parseFloat(eveningPrice)
      });
    }

    try {
      const res = await axios.post('/api/slots', {
        ground_id: selectedGround.id,
        sport_id: selectedSport.id,
        booking_date: selectedDate,
        opening_time: openingTime,
        closing_time: closingTime,
        slot_duration: slotDuration,
        base_price: parseFloat(basePrice),
        price_config: priceConfig,
        overs: selectedSport.name === 'Cricket' ? overs : null,
        ball_type: selectedSport.name === 'Cricket' ? ballType : null
      });

      toast.success(res.data.message);
      loadSlots(); // Reload grid
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error generating slots');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleBlock = async (slotId, currentStatus) => {
    const isBlocked = currentStatus === 'blocked';
    
    try {
      const res = await axios.patch(`/api/slots/${slotId}/block`, {
        block: !isBlocked
      });
      
      toast.success(res.data.message);
      // Update local state
      setSlots(prev =>
        prev.map(slot =>
          slot.id === slotId ? { ...slot, status: res.data.status } : slot
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating slot status');
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-extrabold text-white">Time Slots Configuration</h1>
        <p className="text-sm text-slate-400">Set active times, configure pricing, and block/unblock turf grids</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Generator Control */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 h-fit">
          <h3 className="font-bold text-white text-base pb-3 border-b border-slate-850 flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-500" /> Dynamic Generator
          </h3>

          <form onSubmit={handleGenerateSlots} className="space-y-4 text-xs">
            
            {/* Ground Selector */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Select Ground</label>
              <select 
                value={selectedGround?.id || ''}
                onChange={(e) => setSelectedGround(grounds.find(g => g.id === parseInt(e.target.value)))}
                className="w-full bg-slate-950 text-slate-100 py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {grounds.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Sport Selector */}
            {selectedGround && (
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Select Sport</label>
                <select 
                  value={selectedSport?.id || ''}
                  onChange={(e) => setSelectedSport(selectedGround.sports.find(s => s.id === parseInt(e.target.value)))}
                  className="w-full bg-slate-950 text-slate-100 py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {selectedGround.sports && selectedGround.sports.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Select */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              />
            </div>

            {/* Timings */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Opening Time</label>
                <input 
                  type="text" 
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  placeholder="06:00:00"
                  className="w-full bg-slate-950 text-slate-100 py-2 px-3 rounded-lg border border-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Closing Time</label>
                <input 
                  type="text" 
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  placeholder="22:00:00"
                  className="w-full bg-slate-950 text-slate-100 py-2 px-3 rounded-lg border border-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Cricket Configurations */}
            {selectedSport?.name === 'Cricket' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Overs</label>
                  <select 
                    value={overs}
                    onChange={(e) => setOvers(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Unlimited">Unlimited</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Ball Type</label>
                  <select 
                    value={ballType}
                    onChange={(e) => setBallType(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Any Ball">Any Ball</option>
                    <option value="Red Stitch Ball">Red Stitch Ball</option>
                    <option value="White Stitch Ball">White Stitch Ball</option>
                    <option value="Cosco Ball">Cosco Ball</option>
                    <option value="Stumper Ball">Stumper Ball</option>
                  </select>
                </div>
              </div>
            )}

            {/* Duration */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Slot Duration</label>
              <select 
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="30 minutes">30 Minutes</option>
                <option value="1 hour">1 Hour</option>
                <option value="2 hours">2 Hours</option>
              </select>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-850">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Base Price (₹/hr)</label>
                <input 
                  type="number" 
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 py-2 px-3 rounded-lg border border-slate-800 focus:outline-none"
                />
              </div>
              
              {/* Evening pricing toggle */}
              <div className="flex items-center gap-2 py-1">
                <input 
                  type="checkbox" 
                  id="evening-pricing"
                  checked={enableEveningPricing}
                  onChange={(e) => setEnableEveningPricing(e.target.checked)}
                  className="rounded border-slate-800 text-emerald-500 bg-slate-950 focus:ring-emerald-550 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="evening-pricing" className="text-slate-350 cursor-pointer">Enable Evening Price (5 PM - 10 PM)</label>
              </div>

              {enableEveningPricing && (
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-1">Evening Price (₹/hr)</label>
                  <input 
                    type="number" 
                    value={eveningPrice}
                    onChange={(e) => setEveningPrice(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 py-2 px-3 rounded-lg border border-slate-800 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={generating}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition cursor-pointer flex items-center justify-center"
            >
              {generating ? 'Generating...' : 'Generate Day Slots'}
            </button>

          </form>
        </div>

        {/* Right Side: Slots Grid View */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
          <div className="flex justify-between items-center pb-3 border-b border-slate-850 mb-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-500" /> Interactive Grids ({slots.length})
            </h3>
            <span className="text-xs text-slate-450 font-semibold">{selectedDate}</span>
          </div>

          {slots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Info className="h-10 w-10 text-slate-750 mb-2" />
              <p className="text-xs text-slate-500">No time slots generated for criteria.</p>
              <p className="text-[10px] text-slate-600 mt-1">Configure opening parameters on the left to spawn slots.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {slots.map(slot => {
                const isBooked = slot.status === 'booked';
                const isBlocked = slot.status === 'blocked';

                return (
                  <div 
                    key={slot.id} 
                    className={`p-3.5 border rounded-xl flex flex-col justify-between items-stretch gap-3 ${
                      isBooked ? 'bg-red-500/5 border-red-500/10 text-red-400' :
                      isBlocked ? 'bg-slate-950 border-slate-850 text-slate-500' :
                      'bg-slate-950 border-slate-850 text-slate-100'
                    }`}
                  >
                    <div className="text-left space-y-1">
                      <span className="text-[11px] font-bold flex items-center gap-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </span>
                      <span className="block text-[10px] text-slate-400">Rate: ₹{parseFloat(slot.price).toFixed(0)}</span>
                      {slot.overs && slot.ball_type && (
                        <span className="block text-[10px] text-emerald-400/80">
                          {slot.overs} {slot.overs !== 'Unlimited' && 'Overs'} • {slot.ball_type}
                        </span>
                      )}
                    </div>

                    {isBooked ? (
                      <span className="text-[10px] uppercase font-bold text-center bg-red-500/10 border border-red-500/20 py-1.5 rounded-lg">Booked</span>
                    ) : (
                      <button 
                        onClick={() => handleToggleBlock(slot.id, slot.status)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                          isBlocked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25' : 
                          'bg-slate-900 text-slate-450 border border-slate-800 hover:border-red-500 hover:text-red-400'
                        }`}
                      >
                        {isBlocked ? (
                          <>
                            <Unlock className="h-3 w-3" /> Unblock Slot
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3" /> Block Slot
                          </>
                        )}
                      </button>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
