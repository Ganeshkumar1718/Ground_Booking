import React, { useState, useEffect, useRef, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { 
  Search, MapPin, Star, Heart, SlidersHorizontal, Map, List, 
  Navigation, X, ShieldCheck, Info, Calendar, Clock, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  
  // Basic states
  const [grounds, setGrounds] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Debounced search state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Filter & sorting states
  const [sportId, setSportId] = useState(searchParams.get('sport_id') || '');
  const [groundType, setGroundType] = useState(searchParams.get('gtype') || '');
  const [pitchType, setPitchType] = useState(searchParams.get('ptype') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [area, setArea] = useState(searchParams.get('area') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [rating, setRating] = useState(searchParams.get('rating') || '');
  const [selectedFacilities, setSelectedFacilities] = useState(
    searchParams.get('facilities') ? searchParams.get('facilities').split(',') : []
  );
  const [date, setDate] = useState(searchParams.get('date') || '');
  const [time, setTime] = useState(searchParams.get('time') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  // Geolocation States
  const [latitude, setLatitude] = useState(
    searchParams.get('latitude') ? parseFloat(searchParams.get('latitude')) : null
  );
  const [longitude, setLongitude] = useState(
    searchParams.get('longitude') ? parseFloat(searchParams.get('longitude')) : null
  );
  const [radius, setRadius] = useState(searchParams.get('radius') || '');
  const [locationStatus, setLocationStatus] = useState(
    searchParams.get('latitude') ? 'detected' : 'idle'
  );

  // Districts / Areas dynamic lists
  const [districtsList, setDistrictsList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  const [allAreasList, setAllAreasList] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [locationSearchText, setLocationSearchText] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  // Fetch districts on load and prefetch areas
  useEffect(() => {
    axios.get('/api/locations/districts')
      .then(async (res) => {
        setDistrictsList(res.data);
        // Pre-fetch all areas for mobile modal search
        try {
          const areasPromises = res.data.map(d => axios.get(`/api/locations/districts/${d.id}/areas`));
          const areasResponses = await Promise.all(areasPromises);
          const allFetched = [];
          areasResponses.forEach((r, idx) => {
            const distName = res.data[idx].name;
            const distId = res.data[idx].id;
            r.data.forEach(a => {
              allFetched.push({ ...a, district_name: distName, district_id: distId });
            });
          });
          setAllAreasList(allFetched);
        } catch (e) {
          console.error('Error prefetching areas:', e);
        }
      })
      .catch(err => console.error('Error fetching districts:', err));
  }, []);

  // Fetch areas dynamically when selected district changes
  useEffect(() => {
    const activeDistrict = district;
    if (activeDistrict && activeDistrict !== 'all' && activeDistrict !== 'nearby' && activeDistrict !== 'All Chennai Region' && activeDistrict !== 'Nearby Chennai') {
      setLoadingAreas(true);
      let dId = activeDistrict;
      // If district is a name, resolve its ID
      if (isNaN(parseInt(activeDistrict))) {
        const found = districtsList.find(d => d.name.toLowerCase() === activeDistrict.toLowerCase());
        if (found) dId = found.id;
      }
      axios.get(`/api/locations/districts/${dId}/areas`)
        .then(res => {
          setAreasList(res.data);
          setLoadingAreas(false);
        })
        .catch(err => {
          console.error('Error fetching areas:', err);
          setLoadingAreas(false);
        });
    } else {
      setAreasList([]);
      setArea('');
    }
  }, [district, districtsList]);

  const handleNearbyChennaiSelect = () => {
    setDistrict('nearby');
    setArea('');
    if (!latitude || !longitude) {
      handleNearMe();
    }
    setSort('distance');
    if (!radius) {
      setRadius('25');
    }
  };

  // UI Control states
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Pagination states
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Leaflet map setup states
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);

  const facilitiesList = [
    'Parking',
    'Flood Lights',
    'Washroom',
    'Changing Room',
    'Drinking Water',
    'Equipment Rental'
  ];

  // Debouncing Effect for Search bar (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch all sports on load
  useEffect(() => {
    axios.get('/api/sports')
      .then(res => setSports(res.data))
      .catch(err => console.error('Error fetching sports:', err));
  }, []);

  // Fetch grounds dynamic loader with query parameters, cancellation token (AbortController), and error boundaries
  useEffect(() => {
    const controller = new AbortController();
    
    // Sync filters to search query params
    const updatedParams = {};
    if (debouncedSearch) updatedParams.search = debouncedSearch;
    if (sportId) updatedParams.sport_id = sportId;
    if (groundType) updatedParams.gtype = groundType;
    if (pitchType) updatedParams.ptype = pitchType;
    if (district) updatedParams.district = district;
    if (area) updatedParams.area = area;
    if (minPrice) updatedParams.min_price = minPrice;
    if (maxPrice) updatedParams.max_price = maxPrice;
    if (rating) updatedParams.rating = rating;
    if (selectedFacilities.length > 0) updatedParams.facilities = selectedFacilities.join(',');
    if (date) updatedParams.date = date;
    if (time) updatedParams.time = time;
    if (sort) updatedParams.sort = sort;
    if (page > 1) updatedParams.page = page;
    
    if (latitude && longitude) {
      updatedParams.latitude = latitude;
      updatedParams.longitude = longitude;
      if (radius) updatedParams.radius = radius;
    }
    
    setSearchParams(updatedParams);

    // Call API with cancellation token
    setLoading(true);

    // Save search history
    if (user && user.role !== 'admin' && (debouncedSearch || sportId || district || area)) {
      axios.post('/api/user/search-history', {
        search_term: debouncedSearch || '',
        filters: updatedParams
      }).catch(err => console.error('Failed to save search history', err));
    }

    axios.get('/api/grounds', { 
      params: updatedParams,
      signal: controller.signal
    })
      .then(res => {
        if (res.data && res.data.success) {
          const payload = res.data.data;
          setGrounds(payload.grounds || []);
          setTotalPages(payload.pagination.totalPages || 1);
          setTotalCount(payload.pagination.total || 0);
        } else {
          // Fallback structure
          setGrounds(Array.isArray(res.data) ? res.data : []);
          setTotalPages(1);
          setTotalCount(res.data.length || 0);
        }
        setLoading(false);
      })
      .catch(err => {
        if (axios.isCancel(err)) {
          return;
        }
        console.error('Error fetching grounds:', err);
        setLoading(false);
        toast.error('Failed to load grounds list');
      });

    return () => {
      controller.abort();
    };
  }, [
    debouncedSearch, sportId, groundType, pitchType, district, area, minPrice, maxPrice, rating, 
    selectedFacilities, date, time, latitude, longitude, radius, sort, page
  ]);

  // Reset page size whenever active search keywords or filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sportId, groundType, pitchType, district, area, minPrice, maxPrice, rating, selectedFacilities, date, time, latitude, longitude, radius, sort]);

  // Leaflet CDN Script injector effect
  useEffect(() => {
    if (viewMode === 'map') {
      // Load CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load JS
      if (!document.getElementById('leaflet-js')) {
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => setMapLoaded(true);
        document.body.appendChild(script);
      } else {
        setMapLoaded(true);
      }
    }
  }, [viewMode]);

  // Map instance creation and popup render synchronization
  useEffect(() => {
    if (viewMode === 'map' && mapLoaded && mapRef.current && !mapInstance.current) {
      const L = window.L;
      // Set initial view to Mumbai location coordinates
      const map = L.map(mapRef.current).setView([19.0544, 72.8402], 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstance.current = map;
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        setMapLoaded(false);
      }
    };
  }, [viewMode, mapLoaded]);

  // Update map marker positions on grounds dataset update
  useEffect(() => {
    if (viewMode === 'map' && mapInstance.current && grounds.length > 0 && window.L) {
      const L = window.L;
      
      // Clean existing marker points
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Add markers
      grounds.forEach(g => {
        if (g.latitude && g.longitude) {
          const marker = L.marker([g.latitude, g.longitude]).addTo(mapInstance.current);
          
          const popupContent = `
            <div style="font-family: sans-serif; min-width: 160px; color: #1e293b; text-align: left;">
              <h4 style="font-weight: 700; margin: 0 0 4px 0; font-size: 13px;">${g.name}</h4>
              <p style="margin: 0; font-size: 11px; color: #64748b;">📍 ${g.city}</p>
              ${g.distance !== undefined ? `<p style="margin: 2px 0; font-size: 11px; font-weight: 600; color: #10b981;">📍 ${(g.distance).toFixed(1)} km away</p>` : ''}
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 700; color: #10b981;">From ₹${parseFloat(g.starting_price || 800).toFixed(0)}/hr</p>
              <a href="/grounds/${g.id}" style="display: block; margin-top: 8px; text-align: center; text-decoration: none; padding: 4px 8px; background-color: #10b981; color: #0f172a; font-size: 11px; font-weight: bold; border-radius: 4px;">View Details</a>
            </div>
          `;
          marker.bindPopup(popupContent);
          markersRef.current.push(marker);
        }
      });

      // Fit map focus area to envelope enclosing pins
      if (markersRef.current.length > 0) {
        const group = new L.featureGroup(markersRef.current);
        mapInstance.current.fitBounds(group.getBounds().pad(0.15));
      }
    }
  }, [grounds, viewMode, mapLoaded]);

  // Geolocation Handler
  const handleNearMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    
    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocationStatus('detected');
        setRadius('10'); // default to 10 km search bounds radius
        toast.success('Location coordinates locked.');
      },
      (error) => {
        console.error('Location error:', error);
        setLocationStatus('denied');
        toast.error('Location permissions denied.');
      }
    );
  };

  const handleClearLocation = () => {
    setLatitude(null);
    setLongitude(null);
    setLocationStatus('idle');
    setRadius('');
  };

  const toggleFacility = (fac) => {
    if (selectedFacilities.includes(fac)) {
      setSelectedFacilities(prev => prev.filter(f => f !== fac));
    } else {
      setSelectedFacilities(prev => [...prev, fac]);
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setSportId('');
    setGroundType('');
    setPitchType('');
    setDistrict('');
    setArea('');
    setMinPrice('');
    setMaxPrice('');
    setRating('');
    setSelectedFacilities([]);
    setDate('');
    setTime('');
    setSort('newest');
    handleClearLocation();
    setPage(1);
  };

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Dynamic Header Block */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div className="text-left space-y-1">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            Explore Arenas <span className="text-emerald-500 font-medium text-lg">({totalCount})</span>
          </h1>
          <p className="text-sm text-slate-400">Book turfs, courts, and fields near your location</p>
        </div>
        
        {/* Toggle List/Map modes */}
        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="h-4 w-4" /> List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'map' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="h-4 w-4" /> Map View
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* SIDEBAR FILTERS (DESKTOP) */}
        {isFilterVisible && (
          <div className="hidden lg:block lg:col-span-1 space-y-6 sticky top-24 h-[calc(100vh-120px)] overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                  <SlidersHorizontal className="h-4 w-4 text-emerald-500" /> Filters
                </h3>
                <button 
                  onClick={handleClearFilters}
                  className="text-xs text-slate-500 hover:text-emerald-400 font-semibold cursor-pointer transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="space-y-5">
            {/* 1. Search Ground Name */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Search Ground Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="🔍 Search ground by name..."
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 pl-9 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-500" />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-3 text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Select Location */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">📍 Select Location</label>
              <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-850">
                <label className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="desktop-district"
                    checked={district === 'all' || district === 'All Chennai Region'}
                    onChange={() => {
                      setDistrict('all');
                      setArea('');
                    }}
                    className="accent-emerald-500 cursor-pointer"
                  />
                  <span>All Chennai Region</span>
                </label>
                {districtsList.map(d => (
                  <label key={d.id} className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="radio"
                      name="desktop-district"
                      checked={district === d.id.toString() || district === d.name}
                      onChange={() => {
                        setDistrict(d.id.toString());
                        setArea('');
                      }}
                      className="accent-emerald-500 cursor-pointer"
                    />
                    <span>{d.name}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer hover:text-white transition-colors">
                  <input
                    type="radio"
                    name="desktop-district"
                    checked={district === 'nearby' || district === 'Nearby Chennai'}
                    onChange={handleNearbyChennaiSelect}
                    className="accent-emerald-500 cursor-pointer"
                  />
                  <span>Nearby Chennai</span>
                </label>
              </div>
            </div>

            {/* 3. Select Area */}
            {district && district !== 'all' && district !== 'nearby' && district !== 'All Chennai Region' && district !== 'Nearby Chennai' && (
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Select Area</label>
                {loadingAreas ? (
                  <div className="text-xs text-slate-505 animate-pulse py-1">Loading areas...</div>
                ) : (
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">All Areas</option>
                    {areasList.map(a => (
                      <option key={a.id} value={a.id.toString()}>{a.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* 4. Use Current Location */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">GPS Location</label>
              <div className="space-y-2">
                {locationStatus === 'idle' && (
                  <button
                    onClick={handleNearMe}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold py-2.5 px-4 rounded-lg transition cursor-pointer"
                  >
                    <Navigation className="h-4 w-4 text-emerald-400" /> Use Current Location
                  </button>
                )}
                {locationStatus === 'detecting' && (
                  <div className="text-xs text-slate-400 bg-slate-950 border border-slate-800 py-2.5 px-4 rounded-lg text-center animate-pulse">
                    Detecting coordinates...
                  </div>
                )}
                {locationStatus === 'detected' && (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2.5 px-3 rounded-lg text-xs font-medium">
                    <span>📍 GPS Detected</span>
                    <button onClick={handleClearLocation} className="text-slate-400 hover:text-white">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                {locationStatus === 'denied' && (
                  <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-400 py-2.5 px-3 rounded-lg text-xs font-medium">
                    <span>⚠️ GPS Denied</span>
                    <button onClick={handleNearMe} className="text-xs text-emerald-400 hover:underline">Retry</button>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Distance Limit */}
            {locationStatus === 'detected' && (
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Distance Range</label>
                <select
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Any Distance</option>
                  <option value="5">Within 5 km</option>
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                </select>
              </div>
            )}

            {/* 6. Sport Selector */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Sport Type</label>
              <select 
                value={sportId}
                onChange={(e) => {
                  setSportId(e.target.value);
                  setGroundType('');
                  setPitchType('');
                }}
                className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">All Sports</option>
                {sports.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* 6a. Conditional Ground Type (For Cricket) */}
            {(sportId === '1' || sports.find(s => s.id.toString() === sportId)?.name.toLowerCase() === 'cricket') && (
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Ground Type</label>
                <select 
                  value={groundType}
                  onChange={(e) => {
                    setGroundType(e.target.value);
                    setPitchType('');
                  }}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Any Ground</option>
                  <option value="open">Open Ground</option>
                  <option value="closed">Closed Turf</option>
                </select>
              </div>
            )}

            {/* 6b. Conditional Pitch Type (For Cricket -> Open Ground) */}
            {(sportId === '1' || sports.find(s => s.id.toString() === sportId)?.name.toLowerCase() === 'cricket') && groundType === 'open' && (
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-2">Pitch Type</label>
                <select 
                  value={pitchType}
                  onChange={(e) => setPitchType(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="">Any Pitch</option>
                  <option value="mat">Mat Pitch</option>
                  <option value="turf">Turf</option>
                  <option value="astro_turf">Astro Turf</option>
                </select>
              </div>
            )}

            {/* 7. Date Availability */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Availability Date</label>
              <div className="relative">
                <input 
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 pl-8 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                />
                <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>

            {/* 8. Time Availability */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Available Time</label>
              <div className="relative">
                <input 
                  type="time"
                  value={time}
                  disabled={!date}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 pl-8 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Clock className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
              </div>
            </div>

            {/* 9. Price Boundaries */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Price Range (₹/hr)</label>
              <div className="flex gap-2 items-center">
                <input 
                  type="number" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min"
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-slate-650">-</span>
                <input 
                  type="number" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max"
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 10. Review Rating */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Review Rating</label>
              <select 
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Any Rating</option>
                <option value="4.0">⭐ 4+ Stars</option>
                <option value="3.0">⭐ 3+ Stars</option>
              </select>
            </div>

            {/* 11. Facilities checklists */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Amenities & Facilities</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {facilitiesList.map((fac, idx) => (
                  <label key={idx} className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer hover:text-white transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedFacilities.includes(fac)}
                      onChange={() => toggleFacility(fac)}
                      className="accent-emerald-500 rounded border-slate-800 cursor-pointer"
                    />
                    <span>{fac}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 12. Sort By */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Sort By</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="newest">Newest Listed</option>
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popularity">Most Popular</option>
                {latitude && longitude && <option value="distance">Nearest Distance</option>}
              </select>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* MOBILE CONTROLLER TOGGLES */}
        <div className="lg:hidden flex gap-2 w-full mb-4">
          <div className="relative flex-1">
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search grounds..."
              className="w-full bg-slate-900 text-slate-100 text-xs py-2.5 px-4 pl-9 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-500" />
          </div>
          
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="flex items-center gap-1.5 px-4 bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-xl cursor-pointer hover:text-emerald-400"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filter
          </button>
        </div>

        {/* LIST VIEW / MAP VIEW MAIN GRID */}
        <div className={`space-y-6 ${isFilterVisible ? 'lg:col-span-3' : 'lg:col-span-4'}`}>

          {/* Sorting and Summary stats */}
          <div className="flex justify-between items-center bg-slate-900/40 border border-slate-900 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFilterVisible(!isFilterVisible)}
                className="hidden lg:flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold rounded-lg cursor-pointer hover:text-emerald-400 hover:border-emerald-500 transition-colors"
              >
                <SlidersHorizontal className="h-4 w-4" /> {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
              </button>
              <span className="text-xs text-slate-400 font-medium">
                Showing {grounds.length} of {totalCount} venues
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Sort By:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-slate-950 text-slate-100 text-xs py-1.5 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="newest">Newest Listed</option>
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popularity">Most Popular</option>
                {latitude && longitude && <option value="distance">Nearest Distance</option>}
              </select>
            </div>
          </div>

          {loading ? (
            /* Skeleton Loading State Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="bg-slate-900 border border-slate-800 rounded-2xl h-96 animate-pulse flex flex-col justify-between p-4">
                  <div className="w-full h-40 bg-slate-800 rounded-xl"></div>
                  <div className="h-5 w-2/3 bg-slate-800 rounded mt-4"></div>
                  <div className="h-4 w-1/2 bg-slate-800 rounded mt-2"></div>
                  <div className="h-4 w-1/3 bg-slate-800 rounded mt-2"></div>
                  <div className="h-8 w-full bg-slate-800 rounded-lg mt-6"></div>
                </div>
              ))}
            </div>
          ) : viewMode === 'map' ? (
            /* Interactive Leaflet Map View */
            <div className="relative">
              <div 
                ref={mapRef} 
                className="w-full h-[550px] rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden relative z-10"
              />
              {grounds.length === 0 && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-slate-800">
                  <MapPin className="h-12 w-12 text-slate-650 mb-3" />
                  <h4 className="font-bold text-white mb-1">No map locations matches</h4>
                  <p className="text-xs text-slate-400">Broaden your filters to view positions on map</p>
                </div>
              )}
            </div>
          ) : grounds.length === 0 ? (
            /* Beautiful empty states */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center flex flex-col items-center justify-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-950 flex items-center justify-center text-slate-550 border border-slate-800">
                <Search className="h-8 w-8" />
              </div>
              
              {locationStatus === 'denied' ? (
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">📍 Location unavailable</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    Enable location permissions in your browser or clear the location filters to discover local grounds.
                  </p>
                  <button 
                    onClick={handleNearMe} 
                    className="mt-4 px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-600 transition"
                  >
                    Enable Location
                  </button>
                </div>
              ) : radius && locationStatus === 'detected' ? (
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">📍 No grounds found nearby</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    There are no venues within {radius} km of your location. Try expanding your search radius boundaries.
                  </p>
                  <select 
                    value={radius} 
                    onChange={(e) => setRadius(e.target.value)}
                    className="mt-4 bg-slate-950 text-slate-100 text-xs py-2 px-4 rounded-lg border border-slate-850 focus:outline-none"
                  >
                    <option value="25">Search Within 25 km</option>
                    <option value="">Any Distance</option>
                  </select>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">🔍 No grounds found</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto">
                    We couldn't find any sports arenas matching your query. Try broadening your filter selection.
                  </p>
                  <button 
                    onClick={handleClearFilters}
                    className="mt-4 px-5 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg hover:bg-emerald-600 transition"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Grounds Grid view */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {grounds.map(ground => (
                <Link 
                  to={`/grounds/${ground.id}`} 
                  key={ground.id}
                  className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-emerald-500 transition duration-300 flex flex-col relative h-full"
                >
                  {/* Photo Container with Lazy Loading */}
                  <div className="aspect-video w-full bg-slate-800 relative overflow-hidden">
                    <img 
                      src={ground.main_photo || (import.meta.env.VITE_API_URL || '') + '/uploads/default-main.jpg'} 
                      alt={ground.name} 
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 right-3 bg-slate-950/80 border border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-200 flex items-center gap-1">
                      <Heart className="h-3 w-3 fill-red-500 text-red-500" /> {ground.total_likes}
                    </div>
                  </div>

                  {/* Ground Specifications content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-left">
                      <div className="flex justify-between items-center gap-2">
                        {/* Verified status badge */}
                        <div className="flex items-center gap-1 text-[10px] font-extrabold bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full text-emerald-400 uppercase tracking-wider">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Verified
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block truncate max-w-[120px]">
                          {ground.sports_names || 'Multi-sport'}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {ground.name}
                      </h3>

                      {/* Location distance calculator display */}
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>{ground.city}, {ground.state}</span>
                        </p>
                        {ground.distance !== undefined && (
                          <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 pl-5">
                            📍 {(ground.distance).toFixed(1)} km away
                          </p>
                        )}
                      </div>

                      {/* Rating details & Review counts */}
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold pl-0.5">
                        <Star className="h-3.5 w-3.5 fill-amber-400 shrink-0" />
                        <span>{parseFloat(ground.average_rating || 0).toFixed(1)}</span>
                        <span className="text-slate-500 font-medium">({ground.review_count || 0} reviews)</span>
                      </div>
                    </div>

                    {/* pricing display footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
                      <span className="font-medium">Starting Price</span>
                      <span className="text-white font-black text-base">
                        ₹{ground.starting_price && parseFloat(ground.starting_price) > 0 ? parseFloat(ground.starting_price).toFixed(0) : '800'}/{ground.price_type === 'match' ? 'match' : 'hr'}
                      </span>
                    </div>

                    {/* View details overlay trigger button */}
                    <div className="w-full flex items-center justify-center gap-1 py-2 bg-slate-950 text-emerald-400 text-xs font-bold rounded-lg border border-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 transition duration-300">
                      <span>View Details</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* PAGINATION COMPONENT BLOCK */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6 border-t border-slate-800">
              <button
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-500 transition-all"
              >
                Prev
              </button>
              
              {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pNumber => (
                <button
                  key={pNumber}
                  onClick={() => setPage(pNumber)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    page === pNumber 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-emerald-500'
                  }`}
                >
                  {pNumber}
                </button>
              ))}

              <button
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-slate-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:border-emerald-500 transition-all"
              >
                Next
              </button>
            </div>
          )}

        </div>

      </div>

      {/* MOBILE SLIDE-UP BOTTOM SHEET FOR FILTERS */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end justify-center lg:hidden">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            
            {/* Header control */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-850">
              <h3 className="font-bold text-white flex items-center gap-1.5 text-sm uppercase tracking-wider">
                <SlidersHorizontal className="h-4 w-4 text-emerald-400" /> Filters
              </h3>
              <button 
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable forms */}
            <div className="flex-1 overflow-y-auto py-2 space-y-5 pr-1">
              
              {/* Geolocation */}
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-2">Location Discovery</label>
                <div className="space-y-2">
                  {locationStatus === 'idle' && (
                    <button
                      onClick={handleNearMe}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white text-xs font-bold py-2.5 rounded-lg transition"
                    >
                      <Navigation className="h-4 w-4 text-emerald-400" />📍 Near Me
                    </button>
                  )}
                  {locationStatus === 'detecting' && (
                    <div className="text-xs text-slate-450 bg-slate-950 border border-slate-800 py-2.5 rounded-lg text-center animate-pulse">
                      Detecting position...
                    </div>
                  )}
                  {locationStatus === 'detected' && (
                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-2 px-3 rounded-lg text-xs font-medium">
                      <span>📍 Geolocation locked</span>
                      <button onClick={handleClearLocation} className="text-slate-400 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {locationStatus === 'denied' && (
                    <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 text-red-400 py-2 px-3 rounded-lg text-xs font-medium">
                      <span>⚠️ Permission denied</span>
                      <button onClick={handleNearMe} className="text-xs text-emerald-400 hover:underline">Retry</button>
                    </div>
                  )}

                  {locationStatus === 'detected' && (
                    <div className="pt-1">
                      <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Limit distance range</label>
                      <select
                        value={radius}
                        onChange={(e) => setRadius(e.target.value)}
                        className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-805"
                      >
                        <option value="">Any Distance</option>
                        <option value="1">Within 1 km</option>
                        <option value="5">Within 5 km</option>
                        <option value="10">Within 10 km</option>
                        <option value="25">Within 25 km</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* District */}
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-2">District / Region</label>
                <select 
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setArea('');
                  }}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800"
                >
                  <option value="all">All Districts</option>
                  {districtsList.map((d) => (
                    <option key={d.id} value={d.id.toString()}>{d.name}</option>
                  ))}
                  <option value="nearby">Nearby Chennai</option>
                </select>
              </div>

              {/* Area */}
              {district && district !== 'all' && district !== 'nearby' && (
                <div>
                  <label className="block text-xs text-slate-400 font-bold mb-2">Area / Locality</label>
                  <select 
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800"
                  >
                    <option value="">All Areas</option>
                    {areasList.map((a) => (
                      <option key={a.id} value={a.id.toString()}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sport */}
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-2">Sport Type</label>
                <select 
                  value={sportId}
                  onChange={(e) => setSportId(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800"
                >
                  <option value="">All Sports</option>
                  {sports.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Date & time availability */}
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-2">Availability Planner</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800"
                  />
                  <input 
                    type="time"
                    value={time}
                    disabled={!date}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Price limits */}
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-2">Price Budget (₹/hr)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    value={minPrice} 
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Min"
                    className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800"
                  />
                  <span className="text-slate-650">-</span>
                  <input 
                    type="number" 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Max"
                    className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800"
                  />
                </div>
              </div>

              {/* Review rating */}
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-2">Reviews Rating</label>
                <select 
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800"
                >
                  <option value="">Any Rating</option>
                  <option value="4.0">⭐ 4+ Stars</option>
                  <option value="3.0">⭐ 3+ Stars</option>
                </select>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-2">Amenities</label>
                <div className="grid grid-cols-2 gap-2">
                  {facilitiesList.map((fac, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFacilities.includes(fac)}
                        onChange={() => toggleFacility(fac)}
                        className="accent-emerald-500 rounded border-slate-800"
                      />
                      <span>{fac}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom action bar */}
            <div className="flex gap-3 pt-4 border-t border-slate-850">
              <button
                onClick={() => {
                  handleClearFilters();
                  setMobileFilterOpen(false);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl"
              >
                Clear All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl"
              >
                Apply Filters
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
    </>
  );
}
