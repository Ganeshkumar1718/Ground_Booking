import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MapPin, Plus, Edit2, CheckCircle, AlertCircle, Trash2, 
  Map, PlusCircle, ToggleLeft, ToggleRight, Building2, ListCollapse 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function LocationManagement() {
  const [districts, setDistricts] = useState([]);
  const [areas, setAreas] = useState([]);
  const [grounds, setGrounds] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingGrounds, setLoadingGrounds] = useState(false);

  // Filter Selection
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');

  // Creation Modals / Forms
  const [newDistrictName, setNewDistrictName] = useState('');
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaDistrictId, setNewAreaDistrictId] = useState('');

  // Fetch all districts on load
  const fetchDistricts = () => {
    setLoadingDistricts(true);
    axios.get('/api/locations/districts?all=true')
      .then(res => {
        setDistricts(res.data);
        setLoadingDistricts(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingDistricts(false);
        toast.error('Failed to load districts');
      });
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  // Fetch areas when selectedDistrictId changes (for the filter dropdown)
  useEffect(() => {
    if (selectedDistrictId) {
      setLoadingAreas(true);
      axios.get(`/api/locations/districts/${selectedDistrictId}/areas?all=true`)
        .then(res => {
          setAreas(res.data);
          setLoadingAreas(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingAreas(false);
          toast.error('Failed to load areas');
        });
    } else {
      setAreas([]);
      setSelectedAreaId('');
    }
  }, [selectedDistrictId]);

  // Fetch grounds by filtered location
  const fetchGroundsByLocation = () => {
    setLoadingGrounds(true);
    axios.get('/api/locations/grounds', {
      params: {
        district_id: selectedDistrictId || undefined,
        area_id: selectedAreaId || undefined
      }
    })
      .then(res => {
        setGrounds(res.data);
        setLoadingGrounds(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingGrounds(false);
        toast.error('Failed to load grounds');
      });
  };

  useEffect(() => {
    fetchGroundsByLocation();
  }, [selectedDistrictId, selectedAreaId]);

  // Add new District
  const handleAddDistrict = (e) => {
    e.preventDefault();
    if (!newDistrictName.trim()) return;

    axios.post('/api/locations/districts', { name: newDistrictName })
      .then(() => {
        toast.success('District created successfully!');
        setNewDistrictName('');
        fetchDistricts();
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Failed to create district');
      });
  };

  // Add new Area
  const handleAddArea = (e) => {
    e.preventDefault();
    if (!newAreaName.trim() || !newAreaDistrictId) {
      toast.error('Select a district and input area name');
      return;
    }

    axios.post('/api/locations/areas', { 
      district_id: parseInt(newAreaDistrictId),
      name: newAreaName 
    })
      .then(() => {
        toast.success('Area created successfully!');
        setNewAreaName('');
        // Trigger area reload if we are currently looking at that district
        if (selectedDistrictId === newAreaDistrictId) {
          setSelectedDistrictId('');
          setTimeout(() => setSelectedDistrictId(newAreaDistrictId), 50);
        }
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Failed to create area');
      });
  };

  // Toggle District Status
  const handleToggleDistrictStatus = (district) => {
    const nextStatus = district.status === 'active' ? 'disabled' : 'active';
    axios.put(`/api/locations/districts/${district.id}`, {
      name: district.name,
      status: nextStatus
    })
      .then(() => {
        toast.success(`District set to ${nextStatus}`);
        fetchDistricts();
      })
      .catch(err => {
        toast.error('Failed to update district status');
      });
  };

  // Toggle Area Status
  const handleToggleAreaStatus = (area) => {
    const nextStatus = area.status === 'active' ? 'disabled' : 'active';
    axios.put(`/api/locations/areas/${area.id}`, {
      name: area.name,
      status: nextStatus
    })
      .then(() => {
        toast.success(`Area set to ${nextStatus}`);
        // Reload areas list
        axios.get(`/api/locations/districts/${selectedDistrictId}/areas?all=true`)
          .then(res => setAreas(res.data))
          .catch(err => console.error(err));
      })
      .catch(err => {
        toast.error('Failed to update area status');
      });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 text-left">
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Map className="h-8 w-8 text-emerald-500" /> Location Management
          </h1>
          <p className="text-sm text-slate-400">Configure districts, suburbs, and view grounds distribution</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* DISTRICT MANAGER AND AREA CREATOR */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Add District Panel */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-emerald-400" /> Add New District
            </h3>
            <form onSubmit={handleAddDistrict} className="flex gap-2">
              <input
                type="text"
                placeholder="District Name (e.g. Tambaram)"
                value={newDistrictName}
                onChange={(e) => setNewDistrictName(e.target.value)}
                className="flex-1 bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* Add Area Suburb Panel */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <PlusCircle className="h-4.5 w-4.5 text-emerald-400" /> Add Subregion / Area
            </h3>
            <form onSubmit={handleAddArea} className="space-y-3">
              <select
                value={newAreaDistrictId}
                onChange={(e) => setNewAreaDistrictId(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="">Select Target District</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Area Name (e.g. Velachery)"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="flex-1 bg-slate-950 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>
          </div>

          {/* Districts List Console */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4.5 w-4.5 text-emerald-400" /> Service Districts
            </h3>
            {loadingDistricts ? (
              <div className="text-xs text-slate-500 py-6 text-center animate-pulse">Loading...</div>
            ) : districts.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">No districts listed</div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {districts.map(d => (
                  <div key={d.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-850">
                    <div className="text-left">
                      <span className="font-semibold text-white text-xs block">{d.name}</span>
                      <span className={`text-[10px] ${d.status === 'active' ? 'text-emerald-450' : 'text-slate-500'}`}>
                        {d.status === 'active' ? '● Active' : '● Disabled'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleDistrictStatus(d)}
                      className="text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {d.status === 'active' ? (
                        <ToggleRight className="h-6 w-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-500" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* REGION AREA TREE AND CORRESPONDING GROUNDS VIEW */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
              <ListCollapse className="h-4.5 w-4.5 text-emerald-450" /> Areas & Subregions Inspector
            </h3>

            {/* Selector filter bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Select District to View Areas</label>
                <select
                  value={selectedDistrictId}
                  onChange={(e) => setSelectedDistrictId(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="">Select District</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-semibold mb-1">Filter by Area</label>
                <select
                  disabled={!selectedDistrictId}
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs py-2.5 px-3 rounded-lg border border-slate-800 focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  <option value="">All Areas</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Areas list view */}
            {selectedDistrictId && (
              <div className="space-y-3">
                <span className="block text-xs text-slate-450 font-bold uppercase tracking-wide">Areas under chosen district:</span>
                {loadingAreas ? (
                  <div className="text-xs text-slate-500 py-6 text-center animate-pulse">Loading areas...</div>
                ) : areas.length === 0 ? (
                  <div className="text-xs text-slate-500 py-6 text-center bg-slate-950 border border-slate-850 rounded-xl">No areas added for this district</div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {areas.map(a => (
                      <div 
                        key={a.id} 
                        className={`flex items-center gap-2 py-1.5 px-3.5 rounded-lg border text-xs font-semibold ${
                          a.status === 'active' 
                            ? 'bg-slate-950 border-slate-800 text-slate-200' 
                            : 'bg-slate-950/50 border-slate-900 text-slate-550'
                        }`}
                      >
                        <span>{a.name}</span>
                        <button
                          onClick={() => handleToggleAreaStatus(a)}
                          className="ml-1 text-[10px] text-slate-500 hover:text-white underline cursor-pointer"
                        >
                          {a.status === 'active' ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Grounds distribution matching location */}
            <div className="pt-4 border-t border-slate-800 space-y-4">
              <span className="block text-xs text-slate-455 font-bold uppercase tracking-wide">
                Grounds in selected region ({grounds.length})
              </span>
              {loadingGrounds ? (
                <div className="text-xs text-slate-500 py-6 text-center animate-pulse">Loading grounds...</div>
              ) : grounds.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center bg-slate-950 border border-slate-850 rounded-xl">
                  No sports grounds listed in this region
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {grounds.map(g => (
                    <div key={g.id} className="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-850 hover:border-slate-700 transition">
                      <div className="text-left space-y-0.5">
                        <span className="font-bold text-white text-xs block">{g.name}</span>
                        <span className="text-[10px] text-slate-400 block">
                          📍 {g.area_name || g.city}, {g.district_name || g.district}
                        </span>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="text-[10px] text-slate-500">
                          <span>Owner: {g.owner_name}</span>
                          <span className="block capitalize">Status: {g.status}</span>
                        </div>
                        <a 
                          href={`/grounds/${g.id}`} 
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-bold rounded"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
