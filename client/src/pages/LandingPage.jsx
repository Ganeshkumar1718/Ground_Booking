import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowRight, Trophy, Shield, Calendar, Star, Heart, MapPin, 
  ShieldCheck, Search, Clock, CheckCircle2, ChevronRight, Apple, Play,
  Sparkles, Award, Zap, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getImageUrl } from '../config';

export default function LandingPage() {
  const navigate = useNavigate();
  const [allGrounds, setAllGrounds] = useState([]);
  const [featuredOffset, setFeaturedOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search filter states
  const [searchLocation, setSearchLocation] = useState('');
  const [searchSport, setSearchSport] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [searchTime, setSearchTime] = useState('');

  const fallbackGrounds = [
    {
      id: 1, name: "Royal Cricket Stadium", city: "Anna Nagar", area_name: "Anna Nagar", state: "Chennai", 
      starting_price: 2999, average_rating: 4.9, type: "Popular", sports_names: "Cricket",
      main_photo: "/uploads/1.jpeg"
    },
    {
      id: 2, name: "Victory Football Turf", city: "T. Nagar", area_name: "T. Nagar", state: "Chennai", 
      starting_price: 1999, average_rating: 4.7, type: "Trending", sports_names: "Football",
      main_photo: "/uploads/2.avif"
    },
    {
      id: 3, name: "Ace Tennis Court", city: "Adyar", area_name: "Adyar", state: "Chennai", 
      starting_price: 1499, average_rating: 4.6, type: "Premium", sports_names: "Tennis",
      main_photo: "/uploads/3.jpg"
    },
    {
      id: 4, name: "Super Kings Academy", city: "Medavakkam", area_name: "Medavakkam", state: "Chennai", 
      starting_price: 1499, average_rating: 4.6, type: "Popular", sports_names: "Cricket",
      main_photo: "/uploads/4.avif"
    }
  ];

  useEffect(() => {
    axios.get('/api/grounds')
      .then(res => {
        const list = res.data.success ? res.data.data.grounds : (Array.isArray(res.data) ? res.data : []);
        setAllGrounds(list.length > 0 ? list : fallbackGrounds);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading grounds:', err);
        setAllGrounds(fallbackGrounds);
        setLoading(false);
      });
  }, []);

  const displayedGrounds = allGrounds.length > 0 
    ? allGrounds.slice(featuredOffset, featuredOffset + 4)
    : fallbackGrounds;

  const handlePrevPage = () => {
    setFeaturedOffset(prev => Math.max(0, prev - 4));
  };

  const handleNextPage = () => {
    if (featuredOffset + 4 < allGrounds.length) {
      setFeaturedOffset(prev => prev + 4);
    } else {
      setFeaturedOffset(0);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.append('search', searchLocation);
    if (searchSport) params.append('sport_id', searchSport);
    if (searchDate) params.append('date', searchDate);
    if (searchTime) params.append('time', searchTime);
    navigate(`/explore?${params.toString()}`);
  };

  return (
    <div className="bg-[#080d14] min-h-screen font-sans text-white pb-20 selection:bg-[#22c55e] selection:text-black">
      
      {/* ===================== HERO SECTION ===================== */}
      <section className="relative w-full min-h-[660px] md:min-h-[720px] flex items-center justify-center overflow-hidden pt-8 pb-16">
        {/* Stadium Background Atmosphere */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2200&auto=format&fit=crop" 
            alt="Stadium Floodlights Background" 
            className="w-full h-full object-cover object-center opacity-35 filter brightness-90 contrast-125"
          />
          {/* Radial light glow effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px]"></div>
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-emerald-600/15 rounded-full blur-[160px]"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#080d14]/70 via-[#080d14]/50 to-[#080d14]"></div>
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#080d14] to-transparent"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left Hero Content */}
          <div className="w-full lg:w-[62%] space-y-6 text-left">
            {/* Small Top Badge */}
            <div className="inline-flex items-center space-x-2 border border-emerald-500/30 bg-emerald-950/40 rounded-full px-4 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(34,197,94,0.15)]">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
              <span className="text-[11px] text-[#22c55e] font-bold tracking-widest uppercase">The Best Place To Play</span>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[68px] font-black leading-[1.08] tracking-tight text-white">
              Book Your Perfect <br/>
              <span className="text-[#22c55e] drop-shadow-[0_0_25px_rgba(34,197,94,0.4)]">Sports Arena</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-gray-300 text-base sm:text-lg max-w-xl font-normal leading-relaxed">
              Discover and book the best cricket, football & tennis grounds near you. Play your favorite sport anytime!
            </p>

            {/* Glassmorphic Search Bar */}
            <form 
              onSubmit={handleSearchSubmit} 
              className="bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2.5 flex flex-col md:flex-row items-center gap-2 mt-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              {/* Location Select */}
              <div className="flex-1 flex items-center space-x-3 px-3.5 py-2 border-b md:border-b-0 md:border-r border-white/10 w-full">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col text-left w-full">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Location</span>
                  <select 
                    value={searchLocation} 
                    onChange={(e) => setSearchLocation(e.target.value)}
                    aria-label="Filter grounds by location"
                    className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer w-full py-0.5"
                  >
                    <option value="" className="bg-[#0f172a] text-white">Choose Location</option>
                    <option value="Anna Nagar" className="bg-[#0f172a] text-white">Anna Nagar</option>
                    <option value="T. Nagar" className="bg-[#0f172a] text-white">T. Nagar</option>
                    <option value="Chepauk" className="bg-[#0f172a] text-white">Chepauk</option>
                    <option value="Nungambakkam" className="bg-[#0f172a] text-white">Nungambakkam</option>
                    <option value="Adyar" className="bg-[#0f172a] text-white">Adyar</option>
                    <option value="Guindy" className="bg-[#0f172a] text-white">Guindy</option>
                    <option value="Velachery" className="bg-[#0f172a] text-white">Velachery</option>
                    <option value="Saidapet" className="bg-[#0f172a] text-white">Saidapet</option>
                  </select>
                </div>
              </div>

              {/* Sport Select */}
              <div className="flex-1 flex items-center space-x-3 px-3.5 py-2 border-b md:border-b-0 md:border-r border-white/10 w-full">
                <Trophy className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col text-left w-full">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sport</span>
                  <select 
                    value={searchSport} 
                    onChange={(e) => setSearchSport(e.target.value)}
                    aria-label="Filter grounds by sport"
                    className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer w-full py-0.5"
                  >
                    <option value="" className="bg-[#0f172a] text-white">All Sports</option>
                    <option value="1" className="bg-[#0f172a] text-white">Cricket</option>
                    <option value="2" className="bg-[#0f172a] text-white">Football</option>
                    <option value="3" className="bg-[#0f172a] text-white">Tennis</option>
                  </select>
                </div>
              </div>

              {/* Date Select */}
              <div className="flex-1 flex items-center space-x-3 px-3.5 py-2 border-b md:border-b-0 md:border-r border-white/10 w-full">
                <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col text-left w-full">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date</span>
                  <input 
                    type="date" 
                    value={searchDate} 
                    onChange={(e) => setSearchDate(e.target.value)}
                    aria-label="Filter grounds by date"
                    className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer w-full py-0.5"
                  />
                </div>
              </div>

              {/* Time Select */}
              <div className="flex-1 flex items-center space-x-3 px-3.5 py-2 w-full">
                <Clock className="h-4 w-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col text-left w-full">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Time</span>
                  <select 
                    value={searchTime} 
                    onChange={(e) => setSearchTime(e.target.value)}
                    aria-label="Filter grounds by time slot"
                    className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer w-full py-0.5"
                  >
                    <option value="" className="bg-[#0f172a] text-white">Select Time</option>
                    <option value="morning" className="bg-[#0f172a] text-white">Morning (06:00 - 12:00)</option>
                    <option value="afternoon" className="bg-[#0f172a] text-white">Afternoon (12:00 - 16:00)</option>
                    <option value="evening" className="bg-[#0f172a] text-white">Evening (16:00 - 20:00)</option>
                    <option value="night" className="bg-[#0f172a] text-white">Night (20:00 - 00:00)</option>
                  </select>
                </div>
              </div>

              {/* Search Button */}
              <button 
                type="submit"
                className="bg-[#22c55e] hover:bg-[#1eb053] text-black font-bold px-7 py-3.5 rounded-xl flex items-center justify-center space-x-2 transition-all duration-300 w-full md:w-auto shrink-0 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] cursor-pointer"
              >
                <span className="text-sm font-extrabold tracking-wide">Search</span>
                <ArrowRight className="h-4 w-4 stroke-[3]" />
              </button>
            </form>

            {/* Quick Trust Badges below search bar */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 text-gray-300 text-xs font-medium">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-[#22c55e]" />
                <span className="text-gray-300">100+ Premium Grounds</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-[#22c55e]" />
                <span className="text-gray-300">Instant Booking</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                <span className="text-gray-300">Best Price Guarantee</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded-full border border-[#22c55e] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full"></span>
                </div>
                <span className="text-gray-300">24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Right Floating Showcase Card */}
          <div className="w-full lg:w-[35%] relative">
            {/* Card Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#22c55e]/25 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="bg-[#101826]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.6)] relative z-10 transition-all duration-300 hover:border-emerald-500/40">
              <div className="flex justify-between items-center mb-3.5">
                <h3 className="font-bold text-white text-sm tracking-wide">Your Next Game Awaits</h3>
                <span className="flex items-center space-x-1.5 text-[10px] font-extrabold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-ping"></span>
                  <span>BOOK NOW</span>
                </span>
              </div>

              <div className="relative rounded-2xl overflow-hidden mb-3.5 group">
                <img 
                  src="/uploads/1.jpeg" 
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=800&auto=format&fit=crop"; }}
                  alt="Green Valley Cricket Ground" 
                  className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101826]/90 via-transparent to-transparent opacity-60"></div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md rounded-xl p-2 border border-white/10 shadow-lg">
                  <Calendar className="h-4 w-4 text-[#22c55e]" />
                </div>
              </div>

              <div className="flex justify-between items-start mb-2 text-left">
                <div>
                  <h4 className="font-bold text-white text-base leading-snug">Green Valley Cricket Ground</h4>
                  <div className="flex items-center text-gray-400 text-xs mt-0.5">
                    <MapPin className="h-3 w-3 text-gray-400 mr-1 shrink-0" />
                    <span>Chennai, Tamil Nadu</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 bg-black/40 border border-white/10 px-2 py-1 rounded-lg text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-[#22c55e] text-[#22c55e]" />
                  <span>4.8</span>
                </div>
              </div>

              <div className="flex gap-3 text-[11px] text-gray-300 mb-4 font-medium pt-1">
                <span className="flex items-center"><Trophy className="h-3 w-3 mr-1 text-[#22c55e]"/> Cricket</span>
                <span className="flex items-center"><MapPin className="h-3 w-3 mr-1 text-blue-400"/> Outdoor</span>
                <span className="flex items-center"><Clock className="h-3 w-3 mr-1 text-amber-400"/> Flood Lights</span>
              </div>

              <div className="flex justify-between items-center border-t border-white/10 pt-3.5">
                <div className="text-left">
                  <span className="text-[#22c55e] font-extrabold text-xl">₹2,499</span>
                  <span className="text-gray-400 text-xs font-medium"> / hour</span>
                </div>
                <Link 
                  to="/grounds/1" 
                  className="bg-[#22c55e] hover:bg-[#1eb053] text-black font-extrabold px-6 py-2.5 rounded-xl text-xs transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ===================== EXPLORE BY SPORT ===================== */}
      <section className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Section Heading with green line accents */}
        <div className="flex items-center justify-center space-x-4 mb-10">
          <div className="h-[1px] w-14 bg-gradient-to-l from-[#22c55e] to-transparent"></div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2">
            <span>Explore by Sport</span>
          </h2>
          <div className="h-[1px] w-14 bg-gradient-to-r from-[#22c55e] to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. CRICKET CARD */}
          <div className="group relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#064e3b]/30 via-[#022c22]/30 to-[#0a0f16] overflow-hidden hover:border-[#22c55e]/60 transition-all duration-300 p-6 flex flex-col justify-between min-h-[170px] shadow-[0_10px_30px_rgba(6,78,59,0.15)]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
            
            <div className="relative z-10 flex items-start space-x-4 text-left max-w-[65%]">
              <div className="w-12 h-12 rounded-full bg-emerald-950/80 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.2)] group-hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all">
                <span className="text-xl">🏏</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1.5">Cricket</h3>
                <p className="text-xs text-gray-300 font-medium mb-4 leading-relaxed">Find the best cricket grounds near you</p>
                <Link 
                  to="/explore?sport=cricket" 
                  className="inline-flex items-center space-x-2 bg-[#22c55e] text-black px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-[#1eb053] transition-all shadow-[0_0_12px_rgba(34,197,94,0.3)]"
                >
                  <span>Explore Grounds</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                </Link>
              </div>
            </div>

            {/* Cutout Athlete Image */}
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 translate-x-2 translate-y-1">
              <img 
                src="https://images.unsplash.com/photo-1531415074968-036ba1b575da?q=80&w=400&auto=format&fit=crop" 
                alt="Cricket player" 
                className="w-36 h-36 object-cover rounded-full mix-blend-lighten filter brightness-110 contrast-125"
              />
            </div>
          </div>

          {/* 2. FOOTBALL CARD */}
          <div className="group relative rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#1e3a8a]/30 via-[#0f172a]/30 to-[#0a0f16] overflow-hidden hover:border-blue-500/60 transition-all duration-300 p-6 flex flex-col justify-between min-h-[170px] shadow-[0_10px_30px_rgba(30,58,138,0.15)]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            
            <div className="relative z-10 flex items-start space-x-4 text-left max-w-[65%]">
              <div className="w-12 h-12 rounded-full bg-blue-950/80 flex items-center justify-center border border-blue-500/30 shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all">
                <span className="text-xl">⚽</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1.5">Football</h3>
                <p className="text-xs text-gray-300 font-medium mb-4 leading-relaxed">Play on premium football turfs</p>
                <Link 
                  to="/explore?sport=football" 
                  className="inline-flex items-center space-x-2 bg-[#2563eb] text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-[#1d4ed8] transition-all shadow-[0_0_12px_rgba(37,99,235,0.3)]"
                >
                  <span>Explore Grounds</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                </Link>
              </div>
            </div>

            {/* Cutout Athlete Image */}
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 translate-x-2 translate-y-1">
              <img 
                src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=400&auto=format&fit=crop" 
                alt="Football player" 
                className="w-36 h-36 object-cover rounded-full mix-blend-lighten filter brightness-110 contrast-125"
              />
            </div>
          </div>

          {/* 3. TENNIS CARD */}
          <div className="group relative rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#581c87]/30 via-[#3b0764]/30 to-[#0a0f16] overflow-hidden hover:border-purple-500/60 transition-all duration-300 p-6 flex flex-col justify-between min-h-[170px] shadow-[0_10px_30px_rgba(88,28,135,0.15)]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
            
            <div className="relative z-10 flex items-start space-x-4 text-left max-w-[65%]">
              <div className="w-12 h-12 rounded-full bg-purple-950/80 flex items-center justify-center border border-purple-500/30 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all">
                <span className="text-xl">🎾</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1.5">Tennis</h3>
                <p className="text-xs text-gray-300 font-medium mb-4 leading-relaxed">Book tennis courts anytime</p>
                <Link 
                  to="/explore?sport=tennis" 
                  className="inline-flex items-center space-x-2 bg-[#9333ea] text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-[#7e22ce] transition-all shadow-[0_0_12px_rgba(147,51,234,0.3)]"
                >
                  <span>Explore Courts</span>
                  <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                </Link>
              </div>
            </div>

            {/* Cutout Athlete Image */}
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 translate-x-2 translate-y-1">
              <img 
                src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=400&auto=format&fit=crop" 
                alt="Tennis player" 
                className="w-36 h-36 object-cover rounded-full mix-blend-lighten filter brightness-110 contrast-125"
              />
            </div>
          </div>

        </div>
      </section>


      {/* ===================== MAIN SECTION: FEATURED GROUNDS + TOURNAMENTS ===================== */}
      <section className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Area (2 Cols): Featured Grounds */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-extrabold text-white tracking-wide">Featured Grounds</h2>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrevPage}
                disabled={featuredOffset === 0}
                className="w-9 h-9 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#22c55e]/50 disabled:opacity-40 transition-all cursor-pointer"
                title="Previous Grounds"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              <button 
                onClick={handleNextPage}
                className="w-9 h-9 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#22c55e]/50 transition-all cursor-pointer"
                title="Next Grounds"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 2x2 Grid of Featured Grounds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {displayedGrounds.map((ground, index) => {
              const badgeType = index % 3 === 0 ? 'Popular' : (index % 3 === 1 ? 'Trending' : 'Premium');
              const badgeColor = badgeType === 'Popular' 
                ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30'
                : (badgeType === 'Trending' 
                  ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  : 'bg-purple-500/20 text-purple-400 border-purple-500/30');

              return (
                <div 
                  key={ground.id} 
                  className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden hover:border-[#22c55e]/50 transition-all duration-300 group relative flex flex-col shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                    <img 
                      src={getImageUrl(ground.main_photo || `/uploads/${ground.id}.jpg`)} 
                      onError={(e) => { e.target.src = fallbackGrounds[index % 4].main_photo || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=800&auto=format&fit=crop"; }}
                      alt={ground.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/40 to-transparent"></div>
                    
                    {/* Top Left Rating Badge */}
                    <div className="absolute top-3.5 left-3.5">
                      <div className="flex items-center space-x-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-bold border border-white/10">
                        <Star className="h-3 w-3 fill-[#22c55e] text-[#22c55e]" />
                        <span className="text-white">{ground.average_rating || 4.8}</span>
                      </div>
                    </div>

                    {/* Top Right Type Tag Badge */}
                    <div className="absolute top-3.5 right-3.5">
                      <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                        {badgeType}
                      </div>
                    </div>

                    {/* Title and Location inside bottom of Image */}
                    <div className="absolute bottom-3 left-4 right-4 text-left">
                      <h3 className="font-bold text-lg text-white mb-0.5 line-clamp-1 group-hover:text-[#22c55e] transition-colors">{ground.name}</h3>
                      <p className="text-xs text-gray-300 flex items-center font-medium">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400 shrink-0" /> {ground.area_name || ground.city || 'Chennai'}, {ground.city || 'Chennai'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between text-left">
                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-400 mb-4 font-semibold">
                      <span className="flex items-center bg-white/5 px-2 py-0.5 rounded"><Trophy className="h-3 w-3 mr-1 text-[#22c55e]"/> {ground.sports_names || 'Cricket'}</span>
                      <span className="flex items-center bg-white/5 px-2 py-0.5 rounded"><MapPin className="h-3 w-3 mr-1 text-blue-400"/> Outdoor</span>
                      <span className="flex items-center bg-white/5 px-2 py-0.5 rounded"><Clock className="h-3 w-3 mr-1 text-amber-400"/> Flood Lights</span>
                    </div>

                    <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-auto">
                      <div>
                        <span className="text-[#22c55e] font-extrabold text-lg tracking-wide">₹{ground.starting_price || 1499}</span>
                        <span className="text-gray-400 text-[11px] font-semibold uppercase ml-1">/ hour</span>
                      </div>
                      <Link 
                        to={`/grounds/${ground.id}`} 
                        className="bg-[#22c55e] hover:bg-[#1eb053] text-black font-extrabold px-5 py-2 rounded-xl text-xs transition-all shadow-[0_0_10px_rgba(34,197,94,0.3)] hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                      >
                        Book Now
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats & Testimonial Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* Stats Card */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 flex flex-col justify-center shadow-lg">
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-[#22c55e]/15 flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                    <span className="text-base">🏟️</span>
                  </div>
                  <span className="text-lg font-black text-white">150+</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Premium Grounds</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                    <span className="text-base">👥</span>
                  </div>
                  <span className="text-lg font-black text-white">25K+</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Happy Players</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-500/15 flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <span className="text-base">🎟️</span>
                  </div>
                  <span className="text-lg font-black text-white">50K+</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Bookings Done</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center mb-2 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </div>
                  <span className="text-lg font-black text-white">4.8 ★</span>
                  <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">Average Rating</span>
                </div>
              </div>
            </div>

            {/* Testimonial Card */}
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 relative overflow-hidden text-left flex flex-col justify-between shadow-lg">
              <div className="relative z-10">
                <span className="text-3xl text-[#22c55e] font-serif leading-none block mb-1">“</span>
                <p className="text-gray-200 text-xs sm:text-sm font-medium leading-relaxed mb-4">
                  PlayArena made it so easy to find and book amazing grounds. The experience is top-notch!
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs">— Arjun Kumar</span>
                  <div className="flex text-[#22c55e] mt-0.5">
                    <Star className="h-3 w-3 fill-[#22c55e]" /><Star className="h-3 w-3 fill-[#22c55e]" /><Star className="h-3 w-3 fill-[#22c55e]" /><Star className="h-3 w-3 fill-[#22c55e]" /><Star className="h-3 w-3 fill-[#22c55e]" />
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border-2 border-emerald-500/50 shadow-md">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop" 
                    alt="Arjun Kumar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Area (1 Col): Tournaments & Mobile Promo */}
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-extrabold text-white tracking-wide">Upcoming Tournaments</h2>
            <Link to="/tournaments" className="text-[#22c55e] text-xs font-bold uppercase tracking-wider flex items-center hover:text-white transition-colors">
              View All <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>

          {/* Tournament Cards */}
          <div className="space-y-3">
            {/* Tournament 1 */}
            <div className="flex items-center bg-[#111827] border border-white/10 rounded-2xl p-3.5 hover:border-[#22c55e]/50 transition-all duration-300 group cursor-pointer shadow-md">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center mr-3.5 shrink-0 border border-emerald-500/30">
                <Trophy className="h-5 w-5 text-[#22c55e]" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-bold text-white mb-0.5 group-hover:text-[#22c55e] transition-colors">Summer Cricket Cup 2024</h4>
                <p className="text-[11px] text-gray-400 font-medium">Cricket • 32 Teams</p>
              </div>
              <div className="flex flex-col items-center justify-center border-l border-white/10 pl-3.5">
                <span className="text-lg font-black text-white leading-none">25</span>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mt-0.5">May</span>
              </div>
            </div>

            {/* Tournament 2 */}
            <div className="flex items-center bg-[#111827] border border-white/10 rounded-2xl p-3.5 hover:border-blue-500/50 transition-all duration-300 group cursor-pointer shadow-md">
              <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center mr-3.5 shrink-0 border border-blue-500/30">
                <span className="text-lg">⚽</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-bold text-white mb-0.5 group-hover:text-blue-400 transition-colors">Chennai Super League</h4>
                <p className="text-[11px] text-gray-400 font-medium">Football • 16 Teams</p>
              </div>
              <div className="flex flex-col items-center justify-center border-l border-white/10 pl-3.5">
                <span className="text-lg font-black text-white leading-none">02</span>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mt-0.5">Jun</span>
              </div>
            </div>

            {/* Tournament 3 */}
            <div className="flex items-center bg-[#111827] border border-white/10 rounded-2xl p-3.5 hover:border-purple-500/50 transition-all duration-300 group cursor-pointer shadow-md">
              <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center mr-3.5 shrink-0 border border-purple-500/30">
                <span className="text-lg">🎾</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-bold text-white mb-0.5 group-hover:text-purple-400 transition-colors">Tennis Weekend Battle</h4>
                <p className="text-[11px] text-gray-400 font-medium">Tennis • 24 Players</p>
              </div>
              <div className="flex flex-col items-center justify-center border-l border-white/10 pl-3.5">
                <span className="text-lg font-black text-white leading-none">15</span>
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider mt-0.5">Jun</span>
              </div>
            </div>
          </div>

          {/* App Download Promo Card */}
          <div className="bg-gradient-to-br from-[#111827] via-[#131d2e] to-[#0f172a] border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl text-left">
            <div className="relative z-10 max-w-[60%]">
              <h3 className="font-black text-xl text-white mb-1.5 leading-tight">
                Take PlayArena <br/> Everywhere!
              </h3>
              <p className="text-xs text-gray-400 font-medium mb-5 leading-relaxed">
                Download our mobile app and book on the go.
              </p>
              
              {/* App Store Buttons */}
              <div className="space-y-2">
                <button className="flex items-center space-x-2 bg-black/80 border border-white/20 rounded-xl px-3 py-1.5 hover:bg-black transition-all w-full">
                  <Play className="h-4 w-4 text-white fill-white" />
                  <div className="flex flex-col text-left">
                    <span className="text-[7px] text-gray-400 uppercase font-semibold leading-none">GET IT ON</span>
                    <span className="text-[11px] font-bold text-white leading-tight mt-0.5">Google Play</span>
                  </div>
                </button>
                <button className="flex items-center space-x-2 bg-black/80 border border-white/20 rounded-xl px-3 py-1.5 hover:bg-black transition-all w-full">
                  <Apple className="h-4 w-4 text-white fill-white" />
                  <div className="flex flex-col text-left">
                    <span className="text-[7px] text-gray-400 uppercase font-semibold leading-none">Download on the</span>
                    <span className="text-[11px] font-bold text-white leading-tight mt-0.5">App Store</span>
                  </div>
                </button>
              </div>
            </div>

            {/* QR Code on Top Right */}
            <div className="absolute right-4 top-5 bg-white p-1.5 rounded-xl shadow-xl flex flex-col items-center border border-gray-100">
              <div className="w-14 h-14 bg-white grid grid-cols-5 grid-rows-5 gap-0.5 p-0.5">
                <div className="bg-black"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div>
                <div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div>
                <div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div>
                <div className="bg-black"></div><div className="bg-white"></div><div className="bg-black"></div><div className="bg-black"></div><div className="bg-black"></div>
              </div>
              <span className="text-[7px] font-extrabold text-black mt-0.5 text-center leading-tight">Scan to <br/> Download App</span>
            </div>

            {/* Phone Mockup on bottom right */}
            <div className="absolute right-0 -bottom-8 pointer-events-none translate-x-4 opacity-85">
              <div className="w-24 h-40 border-2 border-gray-700 rounded-2xl bg-black overflow-hidden shadow-2xl p-1">
                <div className="w-full h-full bg-[#0a0f16] rounded-xl p-1 flex flex-col gap-1">
                  <div className="h-2 w-10 bg-gray-800 rounded-full mx-auto mb-1"></div>
                  <div className="h-5 w-full bg-[#22c55e]/20 rounded border border-[#22c55e]/30"></div>
                  <div className="h-8 w-full bg-gray-800 rounded"></div>
                  <div className="flex-1 w-full bg-gray-800 rounded"></div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}

