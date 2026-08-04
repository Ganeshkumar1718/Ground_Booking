import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Trash2, CheckCircle, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CameraCapture({ onCapture, groundCoords }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [gpsVerified, setGpsVerified] = useState(false);
  const [distanceOffset, setDistanceOffset] = useState(null);
  
  const [photoCategory, setPhotoCategory] = useState('Main Ground View');
  const [simulationMode, setSimulationMode] = useState(false);

  // Categories list
  const categories = [
    'Main Ground View',
    'Entrance',
    'Playing Area',
    'Facilities',
    'Parking / Changing Room / Additional Area'
  ];

  // Fetch coordinates on mount / when capturing
  const fetchGPSCoordinates = () => {
    setLoadingCoords(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLoadingCoords(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ latitude, longitude });
        setLoadingCoords(false);
        verifyDistance(latitude, longitude);
      },
      (error) => {
        console.warn('Geolocation access failed:', error);
        toast.error('Could not get GPS coordinates. Using default test coordinates.');
        // Fallback to sample coordinates
        const fallbackLat = 19.0544;
        const fallbackLng = 72.8402;
        setCoords({ latitude: fallbackLat, longitude: fallbackLng });
        setLoadingCoords(false);
        verifyDistance(fallbackLat, fallbackLng);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Haversine formula to verify distance between ground and capture coordinates
  const verifyDistance = (lat1, lon1) => {
    if (!groundCoords || !groundCoords.latitude || !groundCoords.longitude) return;
    
    const lat2 = parseFloat(groundCoords.latitude);
    const lon2 = parseFloat(groundCoords.longitude);
    
    const R = 6371e3; // metres
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceMeters = R * c;

    setDistanceOffset(distanceMeters);
    
    // Warn if further than 500 meters
    if (distanceMeters > 500) {
      setGpsVerified(false);
    } else {
      setGpsVerified(true);
    }
  };

  useEffect(() => {
    fetchGPSCoordinates();
  }, [groundCoords]);

  const startCamera = async () => {
    setSimulationMode(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      setCapturedImage(null);
      setSelectedFile(null);
    } catch (err) {
      console.warn('Camera initiation failed, switching to Simulation Mode:', err);
      toast.error('Device camera not available. Enabling simulation mode.');
      setSimulationMode(true);
      setCameraActive(true);
      setCapturedImage(null);
      setSelectedFile(null);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    fetchGPSCoordinates(); // Refresh GPS on capture
    
    if (simulationMode) {
      // Simulate image capture using canvas drawing
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f172a'; // dark navy
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid
      ctx.strokeStyle = '#22c55e'; // emerald
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
      
      ctx.fillStyle = '#f1f5f9';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`PlaySpot Camera Simulator: ${photoCategory}`, canvas.width / 2, canvas.height / 2 - 20);
      
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`Lat: ${coords.latitude || 'N/A'}, Lng: ${coords.longitude || 'N/A'}`, canvas.width / 2, canvas.height / 2 + 10);
      ctx.fillText(`Timestamp: ${new Date().toLocaleString()}`, canvas.width / 2, canvas.height / 2 + 35);

      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      setSelectedFile(null);
      stopCamera();
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      setSelectedFile(null);
      stopCamera();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      fetchGPSCoordinates();
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setSelectedFile(null);
    startCamera();
  };

  const handleSavePhoto = () => {
    if (!capturedImage) return;

    const finalizeSave = (file) => {
      onCapture({
        file,
        previewUrl: capturedImage,
        category: photoCategory,
        latitude: coords.latitude || 19.0544,
        longitude: coords.longitude || 72.8402,
        timestamp: new Date().toISOString()
      });

      // Reset
      setCapturedImage(null);
      setSelectedFile(null);
      setCameraActive(false);
      toast.success(`Saved ${photoCategory}!`);
    };

    if (selectedFile) {
      finalizeSave(selectedFile);
    } else {
      // Convert dataURL to a file object to send via Multer
      fetch(capturedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          finalizeSave(file);
        });
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup tracks on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl mx-auto shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-emerald-500" />
            Live Camera Verification System
          </h3>
          <p className="text-xs text-slate-400">At least 5 distinct photos required for verification</p>
        </div>
        
        {/* Category Selector */}
        <div className="w-full md:w-auto">
          <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1">Select Photo Category</label>
          <select 
            value={photoCategory}
            onChange={(e) => setPhotoCategory(e.target.value)}
            className="w-full md:w-60 bg-slate-800 text-slate-100 text-xs py-2 px-3 rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Geolocation Status Indicator */}
      <div className="mb-4 bg-slate-950/60 rounded-lg p-3 border border-slate-800 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-slate-500 block">Ground Location:</span>
            <span className="text-slate-300 font-mono">
              {groundCoords ? `${parseFloat(groundCoords.latitude).toFixed(4)}, ${parseFloat(groundCoords.longitude).toFixed(4)}` : 'No location set'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Capture Location:</span>
            <span className="text-slate-300 font-mono">
              {loadingCoords ? 'Locating...' : coords.latitude ? `${parseFloat(coords.latitude).toFixed(4)}, ${parseFloat(coords.longitude).toFixed(4)}` : 'N/A'}
            </span>
          </div>
        </div>

        {distanceOffset !== null && (
          <div className="mt-3 flex items-center justify-between border-t border-slate-850 pt-2 text-[11px]">
            <span className="text-slate-400">
              Offset Distance: <span className="font-semibold text-slate-200">{Math.round(distanceOffset)} meters</span>
            </span>
            {distanceOffset > 500 ? (
              <span className="text-amber-400 flex items-center gap-1 font-semibold">
                <AlertTriangle className="h-3 w-3" /> Too far from ground (&gt;500m)
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle className="h-3 w-3" /> Location match
              </span>
            )}
          </div>
        )}
      </div>

      {/* Camera / Image box */}
      <div className="relative aspect-video w-full rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
        {cameraActive && !capturedImage && (
          <>
            {simulationMode ? (
              <div className="text-center p-6 space-y-3">
                <RefreshCw className="h-10 w-10 text-emerald-500 animate-spin mx-auto" />
                <p className="text-slate-300 text-sm font-semibold">Camera Simulator Mode Active</p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Generating canvas verification image tagged with GPS coords.
                </p>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="h-full w-full object-cover"
              />
            )}
          </>
        )}

        {capturedImage && (
          <img src={capturedImage} alt="Captured Preview" className="h-full w-full object-cover" />
        )}

        {!cameraActive && !capturedImage && (
          <div className="text-center p-6 space-y-4">
            <Camera className="h-12 w-12 text-slate-600 mx-auto" />
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button 
                type="button"
                onClick={startCamera}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2.5 px-6 rounded-lg text-sm transition flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Play className="h-4 w-4" /> Open Camera
              </button>
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-6 rounded-lg text-sm transition flex items-center gap-2 border border-slate-700 cursor-pointer w-full sm:w-auto justify-center"
              >
                Upload from Gallery
              </button>
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
            />
            
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-4">
              You must allow camera permissions to capture live. Uploaded images will be tagged with your current GPS coordinates.
            </p>
          </div>
        )}

        {/* Hidden Canvas for capture processing */}
        <canvas ref={canvasRef} className="hidden" width={640} height={480}></canvas>
      </div>

      {/* Camera Control Actions */}
      {(cameraActive || capturedImage) && (
        <div className="mt-4 flex justify-between gap-4">
          <div className="flex gap-2">
            {cameraActive && (
              <button 
                type="button"
                onClick={capturePhoto}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-4 rounded-lg text-xs transition cursor-pointer"
              >
                Capture Photo
              </button>
            )}
            {capturedImage && (
              <>
                <button 
                  type="button"
                  onClick={retakePhoto}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-4 rounded-lg text-xs transition flex items-center gap-1 border border-slate-700 cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" /> Retake
                </button>
                <button 
                  type="button"
                  onClick={handleSavePhoto}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold py-2 px-4 rounded-lg text-xs transition flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle className="h-3 w-3" /> Save to Gallery
                </button>
              </>
            )}
          </div>

          <button 
            type="button"
            onClick={stopCamera}
            className="text-slate-400 hover:text-slate-350 text-xs px-2 cursor-pointer"
          >
            Cancel Feed
          </button>
        </div>
      )}
    </div>
  );
}
