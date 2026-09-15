import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  RefreshCw, 
  Calendar,
  Layers,
  ShieldCheck, 
  ShieldAlert,
  Ban,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Radio,
  FileCode2,
  ExternalLink,
  X
} from 'lucide-react';
import { securityApi, globalRealtimeClient, RealtimeStreamStatus } from '../../services/api';
import { SecurityEvent } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const SecurityEventsModule: React.FC = () => {
  const { isBackendOffline, currentOrg } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [metrics, setMetrics] = useState<{
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    allowed: number;
    blocked: number;
  }>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    allowed: 0,
    blocked: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [appFilter, setAppFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 25;

  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStreamStatus>('CONNECTED');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [eventDetail, setEventDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await securityApi.getSecurityEvents({
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        source: sourceFilter !== 'ALL' ? sourceFilter : undefined,
        application: appFilter !== 'ALL' ? appFilter : undefined,
        search: search.trim() ? search.trim() : undefined,
        page,
        limit
      });

      const loadedEvents = res.events || [];
      setEvents(loadedEvents);
      setTotalCount(res.total || loadedEvents.length);
      if (res.metrics) {
        setMetrics(res.metrics as any);
      }
    } catch (e) {
      console.error('[SecurityEvents] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, actionFilter, sourceFilter, appFilter, search, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, isBackendOffline]);

  // Real-time WebSocket event subscription
  useEffect(() => {
    const unsubStatus = globalRealtimeClient.onStatusChange((status) => {
      setRealtimeStatus(status);
    });

    const unsubEvents = globalRealtimeClient.subscribe((msg: any) => {
      if (!msg) return;
      const type = msg.type || '';
      const data = msg.data || msg;

      if (type === 'security_event.created' || type === 'event' || (data.sourceIp && data.threat)) {
        const newEvt: SecurityEvent = {
          id: data.id || `EVT-${Date.now()}`,
          timestamp: data.timestamp || new Date().toISOString(),
          source: data.source || 'waf',
          sourceIp: data.sourceIp || data.source_ip || '0.0.0.0',
          sourceCountry: data.sourceCountry || 'Indonesia',
          sourceCountryCode: data.sourceCountryCode || 'ID',
          destination: data.destination || data.destination_ip || '10.240.10.1',
          destinationIp: data.destination_ip || data.destination || '10.240.10.1',
          application: data.application || 'Edge Gateway',
          threat: data.threat || data.threatName || data.threat_name || 'Inspection Event',
          threatName: data.threatName || data.threat || 'Inspection Event',
          category: data.category || (data.source === 'waf' ? 'WAF' : data.source === 'firewall' ? 'Firewall' : 'IDS/IPS'),
          eventType: data.eventType || 'telemetry',
          severity: data.severity || 'Medium',
          action: data.action || 'LOG',
          status: (data.action === 'BLOCK' || data.action === 'BLOCKED' || data.action === 'DENY' || data.action === 'DROP') ? 'Mitigated' : 'Detected',
          uri: data.uri,
          method: data.method,
          protocol: data.protocol || 'TCP',
          port: data.port || 443,
          statusCode: data.statusCode || data.status_code,
          payloadSnippet: data.payloadSnippet || data.payload_snippet,
          metadata: data.metadata
        };

        setEvents(prev => {
          if (prev.some(e => e.id === newEvt.id)) return prev;
          return [newEvt, ...prev.slice(0, limit - 1)];
        });

        setTotalCount(prev => prev + 1);
        setMetrics(prev => ({
          ...prev,
          total: prev.total + 1,
          critical: String(newEvt.severity).toLowerCase() === 'critical' ? prev.critical + 1 : prev.critical,
          high: String(newEvt.severity).toLowerCase() === 'high' ? prev.high + 1 : prev.high,
          blocked: (newEvt.action === 'BLOCK' || newEvt.action === 'BLOCKED' || newEvt.action === 'DENY') ? prev.blocked + 1 : prev.blocked,
          allowed: (newEvt.action === 'ALLOW' || newEvt.action === 'ALLOWED') ? prev.allowed + 1 : prev.allowed
        }));
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, [limit]);

  // Open inspect detail
  const handleInspectEvent = async (evt: SecurityEvent) => {
    setSelectedEvent(evt);
    setLoadingDetail(true);
    try {
      const detail = await securityApi.getSecurityEventDetail(evt.id);
      setEventDetail(detail);
    } catch {
      setEventDetail(evt);
    } finally {
      setLoadingDetail(false);
    }
  };

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={fetchEvents} />;
  }

  const applications = Array.from(new Set(events.map(e => e.application || '').filter(Boolean)));
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  return (
    <div className="space-y-6" id="security-events-container">
      {/* Real-time Connection Banner if Lost */}
      {realtimeStatus === 'REAL-TIME CONNECTION LOST' && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 flex items-center justify-between text-rose-200">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-300">REAL-TIME CONNECTION LOST</div>
              <div className="text-xs text-rose-300/80 mt-0.5">
                Ingress telemetry socket disconnected. Background auto-reconnect active.
              </div>
            </div>
          </div>
          <button
            onClick={() => globalRealtimeClient.connect()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
          >
            Reconnect Now
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <span>Security Events Repository</span>
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium tracking-wide bg-slate-900 border-slate-800">
              <span className={`w-2 h-2 rounded-full ${
                realtimeStatus === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' :
                realtimeStatus === 'RECONNECTING' ? 'bg-amber-400 animate-ping' : 'bg-rose-500'
              }`} />
              <span className={
                realtimeStatus === 'CONNECTED' ? 'text-emerald-300' :
                realtimeStatus === 'RECONNECTING' ? 'text-amber-300' : 'text-rose-300'
              }>
                {realtimeStatus === 'CONNECTED' ? 'LIVE STREAM' : realtimeStatus}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real telemetry event store populated from Suricata IDS, OAT WAF inspection engines, and firewall rule hits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Refresh database events"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `oat_security_events_${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (Direct from SQL count) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Events</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{metrics.total.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Critical</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{metrics.critical.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">High</div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">{metrics.high.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">Medium / Low</div>
          <div className="text-xl font-bold font-mono text-blue-300 mt-1">{(metrics.medium + metrics.low).toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Allowed</div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{metrics.allowed.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Mitigated / Blocked</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{metrics.blocked.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Filter by Source IP, Destination, Threat Name, URI, or Event ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Severity */}
        <select
          value={severityFilter}
          onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">Severity: All</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Action */}
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">Action: All</option>
          <option value="BLOCK">BLOCK / DROP</option>
          <option value="ALLOW">ALLOW</option>
          <option value="CHALLENGE">CHALLENGE</option>
          <option value="LOG">LOG ONLY</option>
        </select>

        {/* Source Subsystem */}
        <select
          value={sourceFilter}
          onChange={e => { setSourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">Source: All Subsystems</option>
          <option value="waf">WAF Engine</option>
          <option value="firewall">Firewall Layer</option>
          <option value="suricata">Suricata IDS/IPS</option>
        </select>

        {/* Application */}
        {applications.length > 0 && (
          <select
            value={appFilter}
            onChange={e => { setAppFilter(e.target.value); setPage(1); }}
            className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">App: All Applications</option>
            {applications.map(app => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>
        )}
      </div>

      {/* Events Table / Repository View */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <th className="p-3 w-40">TIMESTAMP</th>
                <th className="p-3">SOURCE IP</th>
                <th className="p-3">TARGET APPLICATION</th>
                <th className="p-3">THREAT / DETECTION</th>
                <th className="p-3">SOURCE</th>
                <th className="p-3">SEVERITY</th>
                <th className="p-3">ACTION</th>
                <th className="p-3 text-right">INSPECT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span className="font-mono text-xs">Querying database events...</span>
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <div className="text-slate-300 font-semibold">NO DATA AVAILABLE</div>
                    <p className="text-xs text-slate-500 mt-1">
                      No security events matched the query filters in the database for this organization.
                    </p>
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td className="p-3 font-semibold text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400">{evt.sourceIp}</span>
                        {evt.sourceCountryCode && (
                          <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                            {evt.sourceCountryCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">
                      <div className="font-sans font-medium">{evt.application}</div>
                      {evt.uri && (
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]" title={evt.uri}>
                          {evt.uri}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-200 max-w-[240px] truncate" title={evt.threat}>
                      <span className="font-medium text-slate-100">{evt.threat}</span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-slate-900 border border-slate-700 text-slate-300">
                        {evt.category || evt.source || 'SEC'}
                      </span>
                    </td>
                    <td className="p-3">
                      <StatusBadge type="severity" value={evt.severity} />
                    </td>
                    <td className="p-3">
                      <StatusBadge type="action" value={evt.action} />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleInspectEvent(evt)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                        title="View Packet & Payload Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{events.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{totalCount.toLocaleString()}</span> recorded telemetry events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <span className="font-mono text-slate-300 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 transition flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Inspection & Forensic Details */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-slate-800 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <FileCode2 className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Event Forensic Inspection: {selectedEvent.id}
                  </h3>
                  <div className="text-[11px] text-slate-400">
                    Timestamp: {new Date(selectedEvent.timestamp).toISOString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedEvent(null); setEventDetail(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Quick Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Source IP</div>
                  <div className="font-mono text-cyan-300 font-semibold mt-0.5">{selectedEvent.sourceIp}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Subsystem</div>
                  <div className="font-mono text-slate-200 mt-0.5 uppercase">{selectedEvent.category || selectedEvent.source}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Severity</div>
                  <div className="mt-0.5"><StatusBadge type="severity" value={selectedEvent.severity} /></div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Action Enforced</div>
                  <div className="mt-0.5"><StatusBadge type="action" value={selectedEvent.action} /></div>
                </div>
              </div>

              {/* Endpoint Context */}
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Network & Application Target</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-slate-300">
                  <div><span className="text-slate-500">Target App:</span> {selectedEvent.application}</div>
                  <div><span className="text-slate-500">Destination:</span> {selectedEvent.destination || '10.240.10.1'}</div>
                  <div><span className="text-slate-500">Protocol:</span> {selectedEvent.protocol || 'TCP'}:{selectedEvent.port || 443}</div>
                  {selectedEvent.method && <div><span className="text-slate-500">HTTP Method:</span> {selectedEvent.method}</div>}
                  {selectedEvent.statusCode && <div><span className="text-slate-500">Response Code:</span> {selectedEvent.statusCode}</div>}
                  {selectedEvent.uri && <div className="col-span-2 truncate"><span className="text-slate-500">URI:</span> {selectedEvent.uri}</div>}
                </div>
              </div>

              {/* Payload Snippet if Present */}
              {selectedEvent.payloadSnippet && (
                <div>
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Matched Payload Snippet / Signature</span>
                    <span className="text-[10px] text-rose-400 font-mono">CRS Pattern Detected</span>
                  </div>
                  <pre className="p-3 rounded-lg bg-[#070b14] border border-rose-950 font-mono text-rose-300 text-[11px] overflow-x-auto whitespace-pre-wrap break-all">
                    {selectedEvent.payloadSnippet}
                  </pre>
                </div>
              )}

              {/* Related Events From Same Source IP */}
              {eventDetail?.relatedEvents && eventDetail.relatedEvents.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Correlated Telemetry from {selectedEvent.sourceIp} ({eventDetail.relatedEvents.length} Recent)
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="p-2">TIME</th>
                          <th className="p-2">THREAT</th>
                          <th className="p-2">ACTION</th>
                          <th className="p-2">SEVERITY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {eventDetail.relatedEvents.map((r: any) => (
                          <tr key={r.id}>
                            <td className="p-2 text-slate-400">{r.timestamp?.slice(11, 19)}</td>
                            <td className="p-2 text-slate-200">{r.threat_name || r.threat}</td>
                            <td className="p-2"><StatusBadge type="action" value={r.action} /></td>
                            <td className="p-2"><StatusBadge type="severity" value={r.severity} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Raw JSON Dump */}
              <div>
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Raw Canonical Ingestion Record
                </div>
                <pre className="p-3 rounded-lg bg-[#070b14] border border-slate-800 font-mono text-cyan-300 text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                  {JSON.stringify(eventDetail || selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end gap-2">
              <button
                onClick={() => { setSelectedEvent(null); setEventDetail(null); }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
