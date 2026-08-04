import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import CameraCapture from '../../components/CameraCapture';
import { MapPin, Info, Camera, CheckCircle, AlertTriangle, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddGround() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const resumeId = searchParams.get('resume');

  // Step state
  const [step, setStep] = useState(resumeId ? 3 : 1); // 1: Location, 2: Details, 3: Photos
  const [loading, setLoading] = useState(false);
  const [createdGroundId, setCreatedGroundId] = useState(resumeId ? parseInt(resumeId) : null);
  const [sports, setSports] = useState([]);

  // Location select resources
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [reverseGeocodeResult, setReverseGeocodeResult] = useState('');
  const [outsideServiceArea, setOutsideServiceArea] = useState(false);

  // Form Fields
  const [locationForm, setLocationForm] = useState({
    address: '',
    city: '',
    state: 'Tamil Nadu',
    latitude: '',
    longitude: '',
    district_id: '',
    area_id: ''
  });

  const [detailsForm, setDetailsForm] = useState({
    name: '',
    description: '',
    selectedSports: [], // array of IDs
    advance_percentage: 20, // Default 20%
    price_type: 'hour',
    ground_type: '',
    pitch_type: ''
  });

  const [capturedPhotos, setCapturedPhotos] = useState([]);

  // Fetch sports on load
  useEffect(() => {
    axios.get('/api/sports')
      .then(res => setSports(res.data))
      .catch(err => console.error(err));
  }, []);

  // Fetch active districts list
  useEffect(() => {
    axios.get('/api/locations/districts')
      .then(res => setDistricts(res.data))
      .catch(err => console.error('Error fetching districts:', err));
  }, []);

  // Fetch areas dynamically when selected district changes
  useEffect(() => {
    if (locationForm.district_id) {
      axios.get(`/api/locations/districts/${locationForm.district_id}/areas`)
        .then(res => setAreas(res.data))
        .catch(err => console.error('Error fetching areas:', err));
    } else {
      setAreas([]);
    }
  }, [locationForm.district_id]);

  // Geolocation range verification and reverse geocoding via Nominatim
  const validateAndReverseGeocode = async (latStr, lngStr) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) return;

    // Bounding box boundary check for Chennai region
    const inBounds = lat >= 12.4 && lat <= 13.5 && lng >= 79.6 && lng <= 80.5;
    setOutsideServiceArea(!inBounds);

    try {
      // OSM Nominatim Reverse Geocoder
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (res.data && res.data.display_name) {
        setReverseGeocodeResult(res.data.display_name);
        
        const addr = res.data.address;
        const stateName = addr.state || 'Tamil Nadu';
        const cityName = addr.city || addr.town || addr.suburb || 'Chennai';
        
        setLocationForm(prev => ({
          ...prev,
          state: stateName,
          city: cityName
        }));
      }
    } catch (err) {
      console.error('OSM reverse geocode error:', err);
    }
  };

  // Forward Geocoding: Resolve Lat/Lng from Address
  const resolveCoordinatesFromAddress = async () => {
    const { address, city, state } = locationForm;
    if (!address || !city || !state) {
      toast.error('Please fill in Address, City, and State to verify location');
      return false;
    }
    
    setLoading(true);
    try {
      const query = `${address}, ${city}, ${state}`;
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      
      if (res.data && res.data.length > 0) {
        const { lat, lon } = res.data[0];
        setLocationForm(prev => ({ ...prev, latitude: lat, longitude: lon }));
        
        // Bounding box boundary check for Chennai region
        const inBounds = parseFloat(lat) >= 12.4 && parseFloat(lat) <= 13.5 && parseFloat(lon) >= 79.6 && parseFloat(lon) <= 80.5;
        setOutsideServiceArea(!inBounds);
        
        setLoading(false);
        setReverseGeocodeResult('Coordinates resolved from typed address');
        toast.success('Location verified successfully!');
        return true;
      } else {
        toast.error('Could not find coordinates for this address. Please be more specific or use GPS.');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('OSM forward geocode error:', err);
      toast.error('Error verifying address. Please use GPS.');
      setLoading(false);
      return false;
    }
  };

  // Browser Geolocation autofill
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationForm(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          address: prev.address || 'My Current GPS Location'
        }));
        await validateAndReverseGeocode(latitude.toString(), longitude.toString());
        setLoading(false);
        toast.success('Location fetched successfully!');
      },
      (error) => {
        toast.error('Error fetching GPS location. Please type manually and click verify.');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    const { address, city, state, district_id, area_id } = locationForm;
    
    if (!address || !city || !state || !district_id || !area_id) {
      toast.error('Please fill in all location details');
      return;
    }

    // Optional GPS - bypass strict coordinate requirements
    if (!locationForm.latitude || !locationForm.longitude) {
      setLocationForm(prev => ({ ...prev, latitude: '0.0', longitude: '0.0' }));
    }
    
    setStep(2);
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    const { name, selectedSports } = detailsForm;
    if (!name) {
      toast.error('Ground name is required');
      return;
    }
    if (selectedSports.length === 0) {
      toast.error('Please select at least one sport');
      return;
    }
    handleFinalSubmit();
  };

  const handleSportToggle = (id) => {
    setDetailsForm(prev => ({
      ...prev,
      selectedSports: [id],
      ground_type: '',
      pitch_type: ''
    }));
  };

  const handlePhotoCapture = (photoObj) => {
    if (capturedPhotos.length >= 15) {
      toast.error('Maximum limit of 15 photos reached');
      return;
    }
    setCapturedPhotos(prev => [...prev, photoObj]);
  };

  const handleDeletePhoto = (index) => {
    setCapturedPhotos(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const selectedDistrict = districts.find(d => d.id === parseInt(locationForm.district_id))?.name || '';
      
      const response = await axios.post('/api/grounds', {
        name: detailsForm.name,
        description: detailsForm.description,
        address: locationForm.address,
        city: locationForm.city,
        district: selectedDistrict,
        state: locationForm.state,
        latitude: parseFloat(locationForm.latitude || '0.0'),
        longitude: parseFloat(locationForm.longitude || '0.0'),
        sports: detailsForm.selectedSports,
        district_id: parseInt(locationForm.district_id),
        area_id: parseInt(locationForm.area_id),
        advance_percentage: parseInt(detailsForm.advance_percentage) || 20,
        price_type: detailsForm.price_type,
        ground_type: detailsForm.ground_type || null,
        pitch_type: detailsForm.pitch_type || null
      });

      setLoading(false);
      if (response.data && response.data.groundId) {
        setCreatedGroundId(response.data.groundId);
        toast.success('Ground details saved! Please upload verification photos.');
        setStep(3);
      } else {
        toast.error('Unexpected error: groundId missing');
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      toast.error(err.response?.data?.message || 'Error submitting ground request');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-left">
      
      {/* Steps indicator */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-6 text-xs sm:text-sm font-semibold">
        <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-emerald-500/25 border border-emerald-500/50' : 'bg-slate-850'}`}>1</span>
          <span>Location</span>
        </div>
        <div className="h-0.5 w-12 bg-slate-800"></div>
        <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-emerald-500/25 border border-emerald-500/50' : 'bg-slate-850'}`}>2</span>
          <span>Ground Details</span>
        </div>
        <div className="h-0.5 w-12 bg-slate-800"></div>
        <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
          <span className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= 3 ? 'bg-emerald-500/25 border border-emerald-500/50' : 'bg-slate-850'}`}>3</span>
          <span>Photos</span>
        </div>
      </div>

      {/* STEP 1: LOCATION DETAILS */}
      {step === 1 && (
        <form onSubmit={handleLocationSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-855 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-500" /> 1. Arena Location Setup
            </h3>
          </div>

          <div className="flex flex-col gap-5">
            
            {/* Action Buttons for Mobile */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                type="button"
                disabled={loading}
                onClick={handleUseCurrentLocation}
                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-3.5 sm:py-2.5 px-4 rounded-xl text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MapPin className="h-4.5 w-4.5" /> {loading ? 'Locating...' : 'Auto-detect using GPS'}
              </button>
              
              <button 
                type="button"
                disabled={loading || !locationForm.address || !locationForm.city || !locationForm.state}
                onClick={resolveCoordinatesFromAddress}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3.5 sm:py-2.5 px-4 rounded-xl text-sm transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Verifying...' : 'Verify Typed Address'}
              </button>
            </div>

            {/* Bounding box boundary warning */}
            {outsideServiceArea && (
              <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-450 p-4 rounded-xl text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">⚠️ Out of Service Area Warning</span>
                  <span className="text-xs">This location is currently outside the PlaySpot service area. It will require manual admin approval before public publication.</span>
                </div>
              </div>
            )}

            {/* Reverse geocoding feedback suggestion */}
            {reverseGeocodeResult && (
              <div className="flex items-start gap-3 bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-xl text-sm text-emerald-350">
                <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-400 mb-1">Location Verified</span>
                  <span className="block italic text-xs">{reverseGeocodeResult}</span>
                </div>
              </div>
            )}

            {/* Street Address */}
            <div>
              <label className="block text-sm text-slate-400 font-semibold mb-2">Street Address</label>
              <input 
                type="text" 
                required
                value={locationForm.address}
                onChange={(e) => {
                  setLocationForm(prev => ({ ...prev, address: e.target.value, latitude: '', longitude: '' }));
                  setReverseGeocodeResult('');
                }}
                placeholder="e.g. 123 Turf Club Road, Near Main Gate"
                className="w-full bg-slate-950 text-slate-100 text-sm py-3.5 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* District Select dropdown */}
              <div>
                <label className="block text-sm text-slate-400 font-semibold mb-2">District</label>
                <select
                  required
                  value={locationForm.district_id}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, district_id: e.target.value, area_id: '' }))}
                  className="w-full bg-slate-950 text-slate-100 text-sm py-3.5 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors"
                >
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Suburb Area Select dropdown */}
              <div>
                <label className="block text-sm text-slate-400 font-semibold mb-2">Area</label>
                <select
                  required
                  disabled={!locationForm.district_id}
                  value={locationForm.area_id}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, area_id: e.target.value }))}
                  className="w-full bg-slate-950 text-slate-100 text-sm py-3.5 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <option value="">Select Area</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* City */}
              <div>
                <label className="block text-sm text-slate-400 font-semibold mb-2">City / Town</label>
                <input 
                  type="text" 
                  required
                  value={locationForm.city}
                  onChange={(e) => {
                    setLocationForm(prev => ({ ...prev, city: e.target.value, latitude: '', longitude: '' }));
                    setReverseGeocodeResult('');
                  }}
                  placeholder="e.g. Chennai"
                  className="w-full bg-slate-950 text-slate-100 text-sm py-3.5 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* State */}
              <div>
                <label className="block text-sm text-slate-400 font-semibold mb-2">State</label>
                <input 
                  type="text" 
                  required
                  value={locationForm.state}
                  onChange={(e) => {
                    setLocationForm(prev => ({ ...prev, state: e.target.value, latitude: '', longitude: '' }));
                    setReverseGeocodeResult('');
                  }}
                  placeholder="e.g. Tamil Nadu"
                  className="w-full bg-slate-950 text-slate-100 text-sm py-3.5 px-4 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3.5 px-4 rounded-xl text-sm transition cursor-pointer"
          >
            Next Step: Details
          </button>
        </form>
      )}

      {/* STEP 2: GROUND DETAILS FORM */}
      {step === 2 && (
        <form onSubmit={handleDetailsSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="font-bold text-white text-base border-b border-slate-855 pb-3 flex items-center gap-2">
            <Info className="h-5 w-5 text-emerald-500" /> 2. Arena Details Setup
          </h3>

          <div className="space-y-4">
            
            {/* Name */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Arena Name</label>
              <input 
                type="text" 
                required
                value={detailsForm.name}
                onChange={(e) => setDetailsForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Vanguard Turf Center"
                className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Description</label>
              <textarea 
                value={detailsForm.description}
                onChange={(e) => setDetailsForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe facilities, turf features, floodlights detail..."
                className="w-full h-32 bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Advance Percentage */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-1">Advance Booking Amount (%)</label>
              <div className="relative">
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  required
                  value={detailsForm.advance_percentage}
                  onChange={(e) => setDetailsForm(prev => ({ ...prev, advance_percentage: e.target.value }))}
                  placeholder="e.g. 20"
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Users will pay this percentage of the slot price as an advance to confirm the booking.</p>
            </div>

            {/* Price Type (Format) */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Pricing Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="price_type"
                    value="hour"
                    checked={detailsForm.price_type === 'hour'}
                    onChange={(e) => setDetailsForm(prev => ({ ...prev, price_type: e.target.value }))}
                    className="accent-emerald-500"
                  />
                  <span>Per Hour</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="price_type"
                    value="match"
                    checked={detailsForm.price_type === 'match'}
                    onChange={(e) => setDetailsForm(prev => ({ ...prev, price_type: e.target.value }))}
                    className="accent-emerald-500"
                  />
                  <span>Per Match</span>
                </label>
              </div>
            </div>

            {/* Sports Checklist */}
            <div>
              <label className="block text-xs text-slate-400 font-semibold mb-2">Select Supported Sports</label>
              <div className="flex flex-wrap gap-2">
                {sports.map(s => {
                  const isChecked = detailsForm.selectedSports.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSportToggle(s.id)}
                      className={`py-2 px-4 rounded-xl text-xs font-semibold border transition cursor-pointer ${isChecked ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold' : 'bg-slate-950 border-slate-800 text-slate-350 hover:border-slate-700'}`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Fields for Cricket */}
            {(detailsForm.selectedSports.some(id => id === 1 || sports.find(s => s.id === id)?.name.toLowerCase() === 'cricket')) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-2">Cricket Ground Type</label>
                  <select 
                    value={detailsForm.ground_type}
                    onChange={(e) => setDetailsForm(prev => ({ ...prev, ground_type: e.target.value, pitch_type: '' }))}
                    className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Select Ground Type</option>
                    <option value="open">Open Ground</option>
                    <option value="closed">Closed Turf</option>
                  </select>
                </div>
                
                {detailsForm.ground_type === 'open' && (
                  <div>
                    <label className="block text-xs text-slate-400 font-semibold mb-2">Cricket Pitch Type</label>
                    <select 
                      value={detailsForm.pitch_type}
                      onChange={(e) => setDetailsForm(prev => ({ ...prev, pitch_type: e.target.value }))}
                      className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">Select Pitch Type</option>
                      <option value="mat">Mat Pitch</option>
                      <option value="turf">Turf</option>
                      <option value="astro_turf">Astro Turf</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Conditional Fields for Football */}
            {(detailsForm.selectedSports.some(id => id === 2 || sports.find(s => s.id === id)?.name.toLowerCase() === 'football')) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-2">Football Ground Type</label>
                  <select 
                    value={detailsForm.ground_type}
                    onChange={(e) => setDetailsForm(prev => ({ ...prev, ground_type: e.target.value }))}
                    className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Select Ground Type</option>
                    <option value="5-a-side">5-a-Side</option>
                    <option value="7-a-side">7-a-Side</option>
                    <option value="9-a-side">9-a-Side</option>
                    <option value="11-a-side">11-a-Side</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 font-semibold mb-2">Football Pitch Type</label>
                  <select 
                    value={detailsForm.pitch_type}
                    onChange={(e) => setDetailsForm(prev => ({ ...prev, pitch_type: e.target.value }))}
                    className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Select Pitch Type</option>
                    <option value="artificial">Artificial Turf (3G/4G)</option>
                    <option value="natural">Natural Grass</option>
                    <option value="indoor">Indoor Hardcourt</option>
                  </select>
                </div>
              </div>
            )}

          </div>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs border border-slate-800 transition cursor-pointer"
            >
              Back
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-grow bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
              ) : (
                'Next Step: Photos'
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: PHOTOS */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h3 className="font-bold text-white text-base border-b border-slate-855 pb-3 flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-500" /> 3. Verification Photos
          </h3>
          <p className="text-xs text-slate-400">Capture at least 5 photos of your ground for admin verification.</p>

          <CameraCapture 
            groundCoords={locationForm}
            onCapture={handlePhotoCapture}
          />

          <div className="mt-6">
            <h4 className="font-bold text-sm text-slate-300 mb-3">Captured Photos ({capturedPhotos.length}/15)</h4>
            {capturedPhotos.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                No photos captured yet. Use the camera above.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {capturedPhotos.map((photo, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden bg-slate-950 border border-slate-850 aspect-video">
                    <img src={URL.createObjectURL(photo.file)} alt="Captured" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleDeletePhoto(idx)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-850 mt-6">
            <button 
              type="button"
              onClick={async () => {
                if (capturedPhotos.length < 5) {
                  toast.error('You need at least 5 photos to submit for verification.');
                  return;
                }
                setLoading(true);
                try {
                  // Upload photos
                  for (let i = 0; i < capturedPhotos.length; i++) {
                    const formData = new FormData();
                    formData.append('photo', capturedPhotos[i].file);
                    formData.append('latitude', capturedPhotos[i].latitude);
                    formData.append('longitude', capturedPhotos[i].longitude);
                    formData.append('category', capturedPhotos[i].category);
                    
                    await axios.post(`/api/grounds/${createdGroundId}/photos`, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                  }
                  
                  // Submit for verification
                  await axios.post(`/api/grounds/${createdGroundId}/submit`);
                  setLoading(false);
                  toast.success('Photos uploaded and ground submitted for verification!');
                  navigate('/owner/dashboard');
                } catch (err) {
                  setLoading(false);
                  console.error(err);
                  toast.error('Error submitting verification. You can retry later from dashboard.');
                }
              }}
              disabled={loading || capturedPhotos.length < 5}
              className="flex-grow bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent"></div>
              ) : (
                'Submit for Verification'
              )}
            </button>
            <button 
              type="button"
              onClick={() => {
                toast.success('Draft saved. You can upload photos later.');
                navigate('/owner/dashboard');
              }}
              className="flex-1 bg-slate-950 hover:bg-slate-850 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs border border-slate-800 transition cursor-pointer"
            >
              Save as Draft (Skip)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
