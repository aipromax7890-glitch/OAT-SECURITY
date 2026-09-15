import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Play, 
  Pause, 
  Trash2, 
  Filter, 
  Globe, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2,
  ArrowDown,
  RefreshCw,
  Search
} from 'lucide-react';
import { telemetryStreamManager, securityApi } from '../../services/api';
import { SecurityEvent } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const LiveTrafficModule: React.FC = () => {
  const { isBackendOffline } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(true);
  const [filterAction, setFilterAction] = useState<'ALL' | 'BLOCKED' | 'ALLOWED' | 'CHALLENGED'>('ALL');
  const [search, setSearch] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED'>('CONNECTED');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const tableBottomRef = useRef<HTMLDivElement>(null);

  // Load initial telemetry events from database
  useEffect(() => {
    let isMounted = true;
    async function loadInitialEvents() {
      try {
        const res = await securityApi.getSecurityEvents({ limit: 50 });
        if (isMounted && res.events) {
          setEvents(res.events);
        }
      } catch (err) {
        console.error('[LiveTraffic] Initial events fetch failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadInitialEvents();
    return () => { isMounted = false; };
  }, [isBackendOffline]);

  useEffect(() => {
    if (isBackendOffline) {
      setConnectionStatus('DISCONNECTED');
      return;
    }

    const unsubscribe = telemetryStreamManager.subscribe(
      (newEvent: SecurityEvent) => {
        if (!isStreaming) return;
        setEvents(prev => {
          if (prev.some(e => e.id === newEvent.id)) return prev;
          return [newEvent, ...prev.slice(0, 99)]; // Keep last 100 events
        });
        setConnectionStatus('CONNECTED');
      },
      (err) => {
        setConnectionStatus('DISCONNECTED');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isStreaming, isBackendOffline]);

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={() => window.location.reload()} />;
  }

  const filteredEvents = events.filter(evt => {
    const actionStr = String(evt.action || '').toUpperCase();
    if (filterAction !== 'ALL' && actionStr !== filterAction) return false;
    const term = (search || '').trim().toLowerCase();
    if (term) {
      const ip = String(evt.sourceIp || '');
      const app = String(evt.application || '').toLowerCase();
      const thr = String(evt.threat || '').toLowerCase();
      return ip.includes(term) || app.includes(term) || thr.includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <span>Live Security Telemetry Stream</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              connectionStatus === 'CONNECTED' 
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}>
              {connectionStatus === 'CONNECTED' ? 'SSE STREAM ACTIVE' : 'STREAM RECONNECTING'}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Server-Sent Events (SSE) ingress channel delivering live packet captures and WAF inspection decisions.
          </p>
        </div>

        {/* Stream Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isStreaming 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? 'Freeze Stream' : 'Resume Ingress'}</span>
          </button>
          <button
            onClick={() => setEvents([])}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Clear Buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">ACTION FILTER:</span>
          {(['ALL', 'BLOCKED', 'ALLOWED', 'CHALLENGED'] as const).map(act => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-2.5 py-1 rounded text-xs font-mono transition ${
                filterAction === act 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter IP, app, or payload..."
            className="w-full pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Stream Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden ${selectedEvent ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 text-xs font-mono text-slate-400">
            <span>STREAM BUFFER: {filteredEvents.length} FRAMES</span>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>LIVE WIRE SPEED</span>
            </div>
          </div>

          <div className="max-h-[550px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[#0a0f1c] z-10 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-2.5">TIME</th>
                  <th className="p-2.5">SOURCE IP</th>
                  <th className="p-2.5">COUNTRY</th>
                  <th className="p-2.5">APPLICATION</th>
                  <th className="p-2.5">THREAT SIGNATURE</th>
                  <th className="p-2.5">SEVERITY</th>
                  <th className="p-2.5">POLICY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-mono text-xs">
                      TIDAK ADA KEJADIAN KEAMANAN YANG TERDETEKSI
                      <span className="block text-[10px] text-slate-600 mt-1">
                        {isStreaming ? 'Menunggu paket telemetri masuk dari wire stream...' : 'Aliran telemetri dijeda.'}
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map(evt => (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`cursor-pointer transition hover:bg-slate-850/60 ${
                        selectedEvent?.id === evt.id ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : ''
                      }`}
                    >
                      <td className="p-2.5 text-slate-400 whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5 font-semibold text-cyan-300 whitespace-nowrap">
                        {evt.sourceIp}
                      </td>
                      <td className="p-2.5 text-slate-300">
                        {evt.sourceCountryCode}
                      </td>
                      <td className="p-2.5 text-slate-300 whitespace-nowrap">
                        {evt.application}
                      </td>
                      <td className="p-2.5 text-slate-300 max-w-xs truncate" title={evt.threat}>
                        {evt.threat}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <StatusBadge type="severity" value={evt.severity} size="sm" />
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        <StatusBadge type="action" value={evt.action} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Packet Inspector Drawer (When row clicked) */}
        {selectedEvent && (
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="text-xs font-mono font-bold text-slate-200">PACKET PAYLOAD INSPECTOR</div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">EVENT ID</span>
                <span className="text-slate-200 font-bold">{selectedEvent.id}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">APPLICATION & DESTINATION</span>
                <span className="text-slate-200">{selectedEvent.application} ({selectedEvent.destination})</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">ORIGIN & REPUTATION</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-cyan-300 font-bold">{selectedEvent.sourceIp}</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                    {selectedEvent.sourceCountryCode}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">THREAT CATEGORY</span>
                <span className="text-rose-300 font-semibold">{selectedEvent.threat}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">POLICY ENFORCEMENT</span>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge type="action" value={selectedEvent.action} />
                  <StatusBadge type="severity" value={selectedEvent.severity} />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 block text-[10px] mb-1">INSPECTION LOG</span>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed overflow-x-auto">
                  Matched Core Rule Set heuristic signature against HTTP URI / POST body parameters. Zero Trust perimeter rule dropped connection with 403 Forbidden.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
