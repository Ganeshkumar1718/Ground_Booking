import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, MapPin, ArrowRight, X, Sparkles, Bell, Clock, Award, Flame, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSportFilter, setSelectedSportFilter] = useState('All');
  const [notifiedTournaments, setNotifiedTournaments] = useState({});
  
  // Registration Modal State for active tournaments
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [registering, setRegistering] = useState(false);

  // Coming Soon Tournaments (without mentioning specific names, labeled Coming Soon)
  const comingSoonTournaments = [
    {
      id: 'cs-1',
      isComingSoon: true,
      name: 'Coming Soon',
      subtitle: 'State-Level T20 Super Cup',
      sport_name: 'Cricket',
      prize_pool: '₹1,00,000 Prize Pool',
      tentative_date: 'Coming Soon • Q3 2026',
      location: 'Premier Stadiums, Chennai',
      teams_limit: '16 Teams Slots',
      image: '/uploads/1.jpeg',
      description: 'The ultimate cricket showdown under lights. Full pitch turf matches with professional umpires and live score tracking.'
    },
    {
      id: 'cs-2',
      isComingSoon: true,
      name: 'Coming Soon',
      subtitle: 'Night Futsal 5v5 Championship',
      sport_name: 'Football',
      prize_pool: '₹50,000 Prize Pool',
      tentative_date: 'Coming Soon • Next Month',
      location: 'Top Astro-Turf Arenas, Chennai',
      teams_limit: '24 Teams Slots',
      image: '/uploads/3.jpg',
      description: 'High-intensity 5-a-side knockout tournament. Fast-paced action, trophy awards, and best striker accolades.'
    },
    {
      id: 'cs-3',
      isComingSoon: true,
      name: 'Coming Soon',
      subtitle: 'Open Doubles Tennis Masters',
      sport_name: 'Tennis',
      prize_pool: '₹35,000 Prize Pool',
      tentative_date: 'Coming Soon • Dates TBA',
      location: 'Synthetic Hard Courts, Chennai',
      teams_limit: '32 Pairs Knockout',
      image: '/uploads/2.avif',
      description: 'Battle across the court for top regional ranking points. Synthetic court tournament featuring standard ATP scoring rules.'
    },
    {
      id: 'cs-4',
      isComingSoon: true,
      name: 'Coming Soon',
      subtitle: 'Box Cricket Blitz Tournament',
      sport_name: 'Cricket',
      prize_pool: '₹40,000 Prize Pool',
      tentative_date: 'Coming Soon • Weekend Special',
      location: 'Indoor Arenas, Chennai',
      teams_limit: '12 Teams Slots',
      image: '/uploads/4.avif',
      description: 'Fast, electric 6-over box cricket format. Custom turf rules, super overs, and dynamic prize distributions.'
    },
    {
      id: 'cs-5',
      isComingSoon: true,
      name: 'Coming Soon',
      subtitle: 'Corporate Turf Cup 2026',
      sport_name: 'Football',
      prize_pool: '₹75,000 + Trophy',
      tentative_date: 'Coming Soon • Registrations Opening',
      location: 'Central Chennai Venues',
      teams_limit: '16 Corporate Squads',
      image: '/uploads/5.jpeg',
      description: 'Inter-company athletic rivalry on the turf. Professional refereeing, broadcast coverage, and networking dinner.'
    },
    {
      id: 'cs-6',
      isComingSoon: true,
      name: 'Coming Soon',
      subtitle: 'Premier Summer Smash League',
      sport_name: 'Tennis',
      prize_pool: '₹25,000 Prize Pool',
      tentative_date: 'Coming Soon • Summer League',
      location: 'SDAT Facility & Metro Courts',
      teams_limit: '20 Teams Slots',
      description: 'Weekend single-elimination tournament for amateur and club-level players with trophies and merchandise sponsor kits.',
      image: '/uploads/6.jpg'
    }
  ];

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/tournaments');
      setTournaments(res.data || []);
    } catch (err) {
      console.error(err);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedTournament) return;
    
    try {
      setRegistering(true);
      const res = await axios.post(`/api/tournaments/${selectedTournament.id}/register`, {
        team_name: teamName
      });
      toast.success(res.data.message || 'Successfully registered!');
      setSelectedTournament(null);
      setTeamName('');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to register');
    } finally {
      setRegistering(false);
    }
  };

  const handleNotifyMe = (tId) => {
    setNotifiedTournaments(prev => ({ ...prev, [tId]: true }));
    toast.success('Reminder set! You will be notified as soon as registrations open.');
  };

  // Combine live and coming soon
  const allDisplayTournaments = [
    ...tournaments,
    ...comingSoonTournaments
  ].filter(item => {
    if (selectedSportFilter === 'All') return true;
    return item.sport_name?.toLowerCase() === selectedSportFilter.toLowerCase();
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-10 text-left">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-8 sm:p-10 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Arena Championships
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Trophy className="h-9 w-9 text-emerald-400 shrink-0" /> Tournaments & Leagues
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Compete with the finest players in your city. Register your squad, showcase your athletic skills, and win thrilling cash prizes and championship trophies!
          </p>
        </div>
        
        <Link 
          to="/owner/tournaments/new" 
          className="relative z-10 bg-slate-950 border border-slate-800 hover:border-emerald-500 hover:text-emerald-400 text-white px-6 py-3.5 rounded-xl font-bold transition-all text-sm whitespace-nowrap shadow-lg flex items-center gap-2 cursor-pointer"
        >
          <Award className="h-4 w-4 text-emerald-400" /> Host a Tournament
        </Link>
      </div>

      {/* Sport Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {['All', 'Cricket', 'Football', 'Tennis'].map((sport) => (
          <button
            key={sport}
            onClick={() => setSelectedSportFilter(sport)}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              selectedSportFilter === sport
                ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Tournaments Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-96 bg-slate-900 border border-slate-800 rounded-3xl animate-pulse"></div>
          ))}
        </div>
      ) : allDisplayTournaments.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
          No tournaments found for {selectedSportFilter}.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {allDisplayTournaments.map((t) => {
            const isComingSoon = t.isComingSoon;
            const isNotified = notifiedTournaments[t.id];

            return (
              <div 
                key={t.id} 
                className={`bg-slate-900 border rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all duration-300 group ${
                  isComingSoon 
                    ? 'border-slate-800 hover:border-amber-500/40 hover:shadow-amber-500/5' 
                    : 'border-slate-800 hover:border-emerald-500/50 hover:shadow-emerald-500/5'
                }`}
              >
                <div>
                  {/* Image Poster */}
                  <div className="h-52 relative overflow-hidden bg-slate-950">
                    <img 
                      src={t.image || `https://loremflickr.com/800/600/tournament?lock=${t.id}`}
                      alt={t.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                    
                    {/* Sport badge */}
                    <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-700/60 px-3 py-1 rounded-lg text-[11px] font-bold text-slate-200">
                      {t.sport_name || 'Sport'}
                    </div>

                    {/* Coming Soon or Registration Open badge */}
                    <div className="absolute top-4 right-4">
                      {isComingSoon ? (
                        <div className="flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 px-3 py-1 rounded-lg text-xs font-extrabold shadow-lg">
                          <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: '4s' }} />
                          <span>Coming Soon</span>
                        </div>
                      ) : (
                        <div className="bg-emerald-500 text-slate-950 px-3 py-1 rounded-lg text-xs font-extrabold shadow-lg shadow-emerald-500/20">
                          Registration Open
                        </div>
                      )}
                    </div>

                    {/* Prize pool badge (if any) */}
                    {t.prize_pool && (
                      <div className="absolute bottom-3 left-4 bg-slate-950/90 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 fill-amber-400" />
                        <span>{t.prize_pool}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Card Content */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-xl font-extrabold ${isComingSoon ? 'text-amber-400' : 'text-white'}`}>
                          {t.name}
                        </h3>
                        {isComingSoon && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                            Teaser
                          </span>
                        )}
                      </div>
                      {t.subtitle && (
                        <p className="text-xs font-semibold text-slate-300 mt-1">{t.subtitle}</p>
                      )}
                    </div>
                    
                    {/* Details list */}
                    <div className="space-y-2.5 text-xs text-slate-350 bg-slate-950/40 border border-slate-850 p-3.5 rounded-2xl">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="font-medium text-slate-200">
                          {isComingSoon 
                            ? t.tentative_date 
                            : `${new Date(t.start_date).toLocaleDateString()} - ${new Date(t.end_date).toLocaleDateString()}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <MapPin className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span className="line-clamp-1 text-slate-300">
                          {isComingSoon ? t.location : `${t.ground_name} (${t.location})`}
                        </span>
                      </div>

                      {t.teams_limit && (
                        <div className="flex items-center gap-2.5">
                          <Users className="h-4 w-4 text-emerald-400 shrink-0" />
                          <span className="text-slate-300">{t.teams_limit}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {t.description || 'Championship details and prize pool announcements will be revealed soon.'}
                    </p>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  {isComingSoon ? (
                    <button 
                      onClick={() => handleNotifyMe(t.id)}
                      className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border ${
                        isNotified 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-slate-950 hover:bg-amber-500/10 border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 shadow-sm'
                      }`}
                    >
                      {isNotified ? (
                        <>
                          <Check className="h-4 w-4 text-emerald-400" /> Reminder Set (Coming Soon)
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 text-amber-400" /> Coming Soon • Notify Me
                        </>
                      )}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setSelectedTournament(t)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold py-3 px-4 rounded-xl text-xs transition flex justify-center items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                    >
                      Register Now <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Registration Modal for live tournaments */}
      {selectedTournament && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-white">Register Team</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedTournament.name}</p>
              </div>
              <button 
                onClick={() => setSelectedTournament(null)} 
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-850 space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Venue:</span>
                <span className="font-semibold text-white">{selectedTournament.ground_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sport:</span>
                <span className="font-semibold text-emerald-400">{selectedTournament.sport_name}</span>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  Team / Squad Name
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Chennai Super Strikers"
                  className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTournament(null)}
                  className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-300 px-4 py-3 rounded-xl font-bold text-xs border border-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-3 rounded-xl font-extrabold text-xs transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  {registering ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
