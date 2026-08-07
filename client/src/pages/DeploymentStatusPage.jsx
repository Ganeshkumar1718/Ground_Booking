import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cloud, Server, AlertCircle, CheckCircle, ExternalLink, Activity, Info } from 'lucide-react';
import { API_URL } from '../config';

export default function DeploymentStatusPage() {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get('/api/deployment-status');
        setStatusData(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching deployment status:', err);
        setError('Failed to load deployment status. The backend might not be reachable.');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <span className="text-sm text-slate-400">Detecting deployment environments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 flex items-start gap-4 text-red-400">
          <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-bold text-lg">Connection Error</h2>
            <p className="mt-1 text-sm text-red-400/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-8">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
          <Activity className="h-8 w-8 text-emerald-500" />
          Deployment Status
        </h1>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Monitor your Vercel (Frontend) and Render (Backend) connections in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Vercel Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-800 via-slate-100 to-slate-800 opacity-80" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                <svg viewBox="0 0 116 100" fill="#000" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M57.5 0L115 100H0L57.5 0Z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Vercel (Frontend)</h2>
            </div>
            {statusData.vercel.connected ? (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
                <CheckCircle className="h-3.5 w-3.5" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                <AlertCircle className="h-3.5 w-3.5" /> Not Connected
              </span>
            )}
          </div>

          <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800/60">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Environment</p>
                <p className="text-slate-200 font-medium">{statusData.vercel.environment}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Deployment URL</p>
                {statusData.vercel.url ? (
                  <a href={statusData.vercel.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition">
                    Open App <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="text-slate-500 italic">N/A (Local / Unlinked)</p>
                )}
              </div>
            </div>
          </div>

          {!statusData.vercel.connected && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" /> How to connect Vercel:
              </h4>
              <ul className="list-decimal pl-5 space-y-1.5 text-xs text-blue-300/80 font-mono">
                <li>Run <code className="bg-blue-900/50 px-1 py-0.5 rounded">npm i -g vercel</code></li>
                <li>Run <code className="bg-blue-900/50 px-1 py-0.5 rounded">vercel link</code> in your terminal</li>
                <li>Follow prompts to link to your Vercel project</li>
              </ul>
            </div>
          )}

          {statusData.vercel.missingConfig && statusData.vercel.missingConfig.length > 0 && (
             <div className="text-xs text-slate-500 space-y-1">
               <span className="font-semibold text-slate-400">Missing Configs:</span>
               <ul className="list-disc pl-4 space-y-0.5">
                 {statusData.vercel.missingConfig.map((msg, i) => <li key={i}>{msg}</li>)}
               </ul>
             </div>
          )}
        </div>

        {/* Render Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 opacity-80" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center shrink-0 shadow-lg">
                <Server className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Render (Backend)</h2>
            </div>
            {statusData.render.connected ? (
              <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold">
                <CheckCircle className="h-3.5 w-3.5" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                <AlertCircle className="h-3.5 w-3.5" /> Not Connected
              </span>
            )}
          </div>

          <div className="space-y-4 bg-slate-950 p-5 rounded-xl border border-slate-800/60">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Service Name</p>
                <p className="text-slate-200 font-medium">{statusData.render.serviceName}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">Backend URL</p>
                {statusData.render.url ? (
                  <a href={statusData.render.url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition truncate max-w-full">
                    API Link <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : (
                  <a href={API_URL} target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition truncate max-w-full" title={API_URL}>
                    {API_URL} <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {!statusData.render.connected && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-indigo-300 text-sm">
              <h4 className="font-bold flex items-center gap-2 mb-2">
                <Info className="h-4 w-4" /> How to connect Render:
              </h4>
              <ul className="list-decimal pl-5 space-y-1.5 text-xs text-indigo-300/80 font-mono">
                <li>Create a <code className="bg-indigo-900/50 px-1 py-0.5 rounded">render.yaml</code> in your project root</li>
                <li>Commit and push the YAML file to your repo</li>
                <li>Go to Render Dashboard, click "New", and select "Blueprint"</li>
              </ul>
            </div>
          )}

          {statusData.render.missingConfig && statusData.render.missingConfig.length > 0 && (
             <div className="text-xs text-slate-500 space-y-1 mt-2">
               <span className="font-semibold text-slate-400">Missing Configs:</span>
               <ul className="list-disc pl-4 space-y-0.5">
                 {statusData.render.missingConfig.map((msg, i) => <li key={i}>{msg}</li>)}
               </ul>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
