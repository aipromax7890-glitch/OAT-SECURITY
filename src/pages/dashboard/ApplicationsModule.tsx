import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, 
  Plus, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  CheckCircle2,
  RefreshCw,
  Sliders,
  Activity,
  AlertTriangle,
  X,
  Eye,
  Radio,
  Wifi,
  WifiOff,
  Globe,
  Clock,
  Zap
} from 'lucide-react';
import { securityApi, globalRealtimeClient, RealtimeStreamStatus } from '../../services/api';
import { ProtectedApplication } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const ApplicationsModule: React.FC = () => {
  const { isBackendOffline, currentOrg } = useAuth();
  const [apps, setApps] = useState<ProtectedApplication[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [metrics, setMetrics] = useState<{
    total: number;
    protected: number;
    monitoring: number;
    offline: number;
    unknown: number;
  }>({
    total: 0,
    protected: 0,
    monitoring: 0,
    offline: 0,
    unknown: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [envFilter, setEnvFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStreamStatus>('CONNECTED');

  // Form states for adding application
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [originIp, setOriginIp] = useState('');
  const [protocol, setProtocol] = useState<'HTTPS' | 'HTTP' | 'gRPC'>('HTTPS');
  const [port, setPort] = useState(443);
  const [environment, setEnvironment] = useState<'Production' | 'Staging' | 'Development'>('Production');
  const [submitting, setSubmitting] = useState(false);

  // Probing state
  const [probingId, setProbingId] = useState<string | null>(null);
  const [probeResult, setProbeResult] = useState<{ id: string; status: string; latency: number } | null>(null);

  // Detail modal state
  const [selectedApp, setSelectedApp] = useState<ProtectedApplication | null>(null);
  const [appDetail, setAppDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await securityApi.getApplications({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        environment: envFilter !== 'ALL' ? envFilter : undefined,
        search: search.trim() ? search.trim() : undefined
      });

      const loadedApps = res.applications || [];
      setApps(loadedApps);
      setTotalCount(res.total || loadedApps.length);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (e) {
      console.error('[ApplicationsModule] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, envFilter, search]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps, isBackendOffline]);

  // Real-time WebSocket listener
  useEffect(() => {
    const unsubStatus = globalRealtimeClient.onStatusChange((status) => {
      setRealtimeStatus(status);
    });

    const unsubEvents = globalRealtimeClient.subscribe((msg: any) => {
      if (!msg) return;
      const type = msg.type || '';
      const data = msg.data || msg;

      if (type === 'application.created' && data.id) {
        setApps(prev => {
          if (prev.some(a => a.id === data.id)) return prev;
          return [data, ...prev];
        });
        setTotalCount(prev => prev + 1);
        setMetrics(prev => ({
          ...prev,
          total: prev.total + 1,
          protected: prev.protected + 1
        }));
      } else if (type === 'application.health_changed') {
        const appId = data.id || data.applicationId;
        const newStatus = data.status;
        const responseTime = data.responseTime;

        if (appId && newStatus) {
          setApps(prev => prev.map(a => a.id === appId ? {
            ...a,
            wafStatus: newStatus === 'ONLINE' ? 'Protected' : 'Offline',
            health: newStatus,
            responseTime: responseTime !== undefined ? responseTime : a.responseTime
          } : a));
        }
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, []);

  // Health probe trigger
  const handleProbeApp = async (app: ProtectedApplication) => {
    setProbingId(app.id);
    setProbeResult(null);
    try {
      const res = await securityApi.checkApplicationHealth(app.id);
      setProbeResult({
        id: app.id,
        status: res.status,
        latency: res.responseTime
      });

      // Update app in state
      setApps(prev => prev.map(a => a.id === app.id ? {
        ...a,
        health: res.status,
        responseTime: res.responseTime,
        wafStatus: res.status === 'ONLINE' ? 'Protected' : 'Offline'
      } : a));

      setTimeout(() => setProbeResult(null), 5000);
    } catch (err) {
      alert('Health probe request failed.');
    } finally {
      setProbingId(null);
    }
  };

  // Inspect application detail
  const handleInspectApp = async (app: ProtectedApplication) => {
    setSelectedApp(app);
    setLoadingDetail(true);
    try {
      const detail = await securityApi.getApplicationDetail(app.id);
      setAppDetail(detail);
    } catch {
      setAppDetail({ application: app, recentEvents: [], activeThreats: [] });
    } finally {
      setLoadingDetail(false);
    }
  };

  // Add new application endpoint
  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await securityApi.createApplication({
        name,
        domain,
        originIp,
        protocol,
        port,
        environment
      });
      setShowAddModal(false);
      setName('');
      setDomain('');
      setOriginIp('');
      fetchApps();
    } catch (err) {
      alert('Failed to register application endpoint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={fetchApps} />;
  }

  return (
    <div className="space-y-6" id="applications-inventory-container">
      {/* Real-time Connection Banner */}
      {realtimeStatus === 'REAL-TIME CONNECTION LOST' && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 flex items-center justify-between text-rose-200">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-300">REAL-TIME CONNECTION LOST</div>
              <div className="text-xs text-rose-300/80 mt-0.5">
                Application edge health monitoring socket disconnected. Reconnecting...
              </div>
            </div>
          </div>
          <button
            onClick={() => globalRealtimeClient.connect()}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
          >
            Reconnect
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-5 h-5 text-cyan-400" />
              <span>Protected Applications & Endpoints</span>
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
                {realtimeStatus === 'CONNECTED' ? 'EDGE PROXY ACTIVE' : realtimeStatus}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real inventory of web applications, microservices, and APIs routed through OAT WAF inspection clusters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchApps}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Refresh application inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Protected Endpoint</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (Direct from SQL calculation) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Endpoints</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{metrics.total}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">WAF Protected</div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{metrics.protected}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-blue-400 uppercase tracking-wider">Monitoring Only</div>
          <div className="text-xl font-bold font-mono text-blue-300 mt-1">{metrics.monitoring}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Offline / Degraded</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{metrics.offline}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Application Name, Public Domain, or Origin IP..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Environment Filter */}
        <select
          value={envFilter}
          onChange={e => setEnvFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">Environment: All</option>
          <option value="Production">Production</option>
          <option value="Staging">Staging</option>
          <option value="Development">Development</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">Status: All</option>
          <option value="Protected">Protected</option>
          <option value="Monitoring">Monitoring</option>
          <option value="Offline">Offline</option>
        </select>
      </div>

      {/* Inventory Table View */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <th className="p-3">APPLICATION NAME</th>
                <th className="p-3">PUBLIC DOMAIN</th>
                <th className="p-3">ORIGIN IP</th>
                <th className="p-3">PROTOCOL</th>
                <th className="p-3">ENVIRONMENT</th>
                <th className="p-3">WAF STATUS</th>
                <th className="p-3">HEALTH & LATENCY</th>
                <th className="p-3 text-right">24H TELEMETRY</th>
                <th className="p-3 text-right">CONTROLS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && apps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span className="font-mono text-xs">Querying application inventory from database...</span>
                  </td>
                </tr>
              ) : apps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <div className="text-slate-300 font-semibold">NO DATA AVAILABLE</div>
                    <p className="text-xs text-slate-500 mt-1">
                      No application endpoints configured for this organization. Click "Add Protected Endpoint" to register one.
                    </p>
                  </td>
                </tr>
              ) : (
                apps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-sans font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          app.health === 'ONLINE' || app.wafStatus === 'Protected'
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400'
                            : app.health === 'OFFLINE' || app.wafStatus === 'Offline'
                            ? 'bg-rose-500 shadow-sm shadow-rose-500'
                            : 'bg-amber-400'
                        }`} />
                        <span>{app.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-cyan-300 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        <span>{app.domain}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">{app.originIp || app.ipAddress || '10.240.10.14'}</td>
                    <td className="p-3 text-slate-300">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                        {app.protocol || 'HTTPS'}:{app.port || 443}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-slate-400 font-sans text-[11px]">{app.environment || 'Production'}</span>
                    </td>
                    <td className="p-3">
                      <StatusBadge type="health" value={app.wafStatus || 'Protected'} />
                    </td>
                    <td className="p-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-mono font-semibold ${
                          app.health === 'ONLINE' || app.wafStatus === 'Protected' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {app.health || (app.wafStatus === 'Offline' ? 'OFFLINE' : 'ONLINE')}
                        </span>
                        {app.responseTime !== undefined && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({app.responseTime}ms)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right text-slate-200">
                      <div className="font-mono text-slate-100">
                        {(app.requests24h || 0).toLocaleString()} <span className="text-slate-500 text-[10px]">reqs</span>
                      </div>
                      <div className="text-[10px] text-rose-400 font-mono">
                        {(app.blocked24h || 0).toLocaleString()} blocked
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleProbeApp(app)}
                          disabled={probingId === app.id}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                          title="Execute Real-time TCP/HTTP Health Probe"
                        >
                          <Zap className={`w-3.5 h-3.5 ${probingId === app.id ? 'animate-bounce text-cyan-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleInspectApp(app)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                          title="Inspect Telemetry & Active Threats"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Application Deep Dive & Telemetry */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-slate-800 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <Server className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Endpoint Telemetry: {selectedApp.name}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {selectedApp.domain} • Origin: {selectedApp.originIp || selectedApp.ipAddress}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedApp(null); setAppDetail(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Protocol & Port</div>
                  <div className="font-mono text-cyan-300 font-semibold mt-0.5">{selectedApp.protocol}:{selectedApp.port}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">24h Ingress Requests</div>
                  <div className="font-mono text-slate-100 font-bold mt-0.5">{(selectedApp.requests24h || 0).toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">24h Blocked Attacks</div>
                  <div className="font-mono text-rose-400 font-bold mt-0.5">{(selectedApp.blocked24h || 0).toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-mono">TLS Security</div>
                  <div className="font-mono text-emerald-400 font-semibold mt-0.5">{selectedApp.tlsStatus || 'TLS 1.3 Active'}</div>
                </div>
              </div>

              {/* Recent Security Events on this Application */}
              <div>
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Recent Ingress Security Events ({appDetail?.recentEvents?.length || 0} Recorded)
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="p-2">TIMESTAMP</th>
                        <th className="p-2">SOURCE IP</th>
                        <th className="p-2">THREAT / SIGNATURE</th>
                        <th className="p-2">ACTION</th>
                        <th className="p-2">SEVERITY</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {appDetail?.recentEvents?.length ? (
                        appDetail.recentEvents.map((e: any) => (
                          <tr key={e.id}>
                            <td className="p-2 text-slate-400">{new Date(e.timestamp).toLocaleTimeString()}</td>
                            <td className="p-2 text-cyan-400">{e.sourceIp}</td>
                            <td className="p-2 text-slate-200">{e.threat}</td>
                            <td className="p-2"><StatusBadge type="action" value={e.action} /></td>
                            <td className="p-2"><StatusBadge type="severity" value={e.severity} /></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500 font-mono">
                            No security incidents detected on this application endpoint in the current window.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Threats Correlated */}
              {appDetail?.activeThreats?.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Active Threat Actors Targeting this Endpoint</span>
                  </div>
                  <div className="space-y-2">
                    {appDetail.activeThreats.map((t: any) => (
                      <div key={t.id} className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/60 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-rose-200 font-mono">{t.attackType} from {t.sourceIp}</div>
                          <div className="text-[11px] text-slate-400 font-sans mt-0.5">{t.summary}</div>
                        </div>
                        <StatusBadge type="severity" value={t.severity} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <button
                onClick={() => handleProbeApp(selectedApp)}
                disabled={probingId === selectedApp.id}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-cyan-800/40"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Probe Endpoint Now</span>
              </button>
              <button
                onClick={() => { setSelectedApp(null); setAppDetail(null); }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Application Endpoint */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1628] shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">Protect New Application Endpoint</h3>
            <p className="text-xs text-slate-400 mb-4">
              Deploy OAT WAF inspection proxy in front of your upstream web server or microservice.
            </p>

            <form onSubmit={handleAddApp} className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Application Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Core Payment Gateway"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Public Domain (FQDN)</label>
                <input
                  type="text"
                  required
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  placeholder="e.g. api.banking.oatsec.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Origin IP Address</label>
                <input
                  type="text"
                  required
                  value={originIp}
                  onChange={e => setOriginIp(e.target.value)}
                  placeholder="e.g. 10.240.10.14"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Protocol</label>
                  <select
                    value={protocol}
                    onChange={e => setProtocol(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                  >
                    <option value="HTTPS">HTTPS (TLS 1.3)</option>
                    <option value="HTTP">HTTP (Auto Upgrade)</option>
                    <option value="gRPC">gRPC / HTTP/2</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Port</label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => setPort(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deployment Environment</label>
                <select
                  value={environment}
                  onChange={e => setEnvironment(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 shadow-md shadow-cyan-950/50 transition"
                >
                  {submitting ? 'Registering...' : 'Provision WAF Protection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
