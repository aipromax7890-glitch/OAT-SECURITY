import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bug, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Ban,
  Radio,
  Eye,
  X,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
  WifiOff
} from 'lucide-react';
import { securityApi, globalRealtimeClient, RealtimeStreamStatus } from '../../services/api';
import { ThreatItem } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const ThreatsModule: React.FC = () => {
  const { isBackendOffline, currentOrg } = useAuth();
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [metrics, setMetrics] = useState<{
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unresolved: number;
  }>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    unresolved: 0
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStreamStatus>('CONNECTED');

  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(null);
  const [threatDetail, setThreatDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [mitigatingId, setMitigatingId] = useState<string | null>(null);

  const fetchThreats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await securityApi.getThreats({
        severity: filterSeverity !== 'ALL' ? filterSeverity : undefined,
        status: filterStatus !== 'ALL' ? filterStatus : undefined,
        category: filterCategory !== 'ALL' ? filterCategory : undefined,
        search: search.trim() ? search.trim() : undefined
      });

      const loadedThreats = res.threats || [];
      setThreats(loadedThreats);
      setTotalCount(res.total || loadedThreats.length);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (e) {
      console.error('[ThreatsModule] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [filterSeverity, filterStatus, filterCategory, search]);

  useEffect(() => {
    fetchThreats();
  }, [fetchThreats, isBackendOffline]);

  // Real-time WebSocket listener for threat updates and new threats
  useEffect(() => {
    const unsubStatus = globalRealtimeClient.onStatusChange((status) => {
      setRealtimeStatus(status);
    });

    const unsubEvents = globalRealtimeClient.subscribe((msg: any) => {
      if (!msg) return;
      const type = msg.type || '';
      const data = msg.data || msg;

      if (type === 'threat.created' && data.id) {
        const newThreat: ThreatItem = {
          id: data.id,
          timestamp: data.timestamp || new Date().toISOString(),
          sourceIp: data.sourceIp || data.source_ip || '0.0.0.0',
          target: data.target || 'Core Service',
          attackType: data.attackType || data.attack_type || 'Perimeter Attack',
          category: data.category || data.attack_type || 'Perimeter Attack',
          severity: data.severity || 'High',
          confidence: data.confidence || 95,
          action: data.action || 'DETECT',
          status: data.status || 'ACTIVE',
          summary: data.summary || 'Correlated security threat',
          detectionReason: data.detectionReason || data.detection_reason,
          affectedApplication: data.affectedApplication || data.affected_application || 'Edge Gateway',
          destination: data.destination,
          timeline: data.timeline || [{ time: new Date().toISOString(), event: 'Threat detected by Correlation Engine' }],
          relatedEvents: data.relatedEvents || [],
          recommendedAction: data.recommendedAction || 'Block ingress IP'
        };

        setThreats(prev => {
          if (prev.some(t => t.id === newThreat.id)) return prev;
          return [newThreat, ...prev];
        });

        setTotalCount(prev => prev + 1);
        setMetrics(prev => ({
          ...prev,
          total: prev.total + 1,
          unresolved: prev.unresolved + 1,
          critical: String(newThreat.severity).toLowerCase() === 'critical' ? prev.critical + 1 : prev.critical,
          high: String(newThreat.severity).toLowerCase() === 'high' ? prev.high + 1 : prev.high
        }));
      } else if (type === 'threat.updated') {
        const threatId = data.threatId || data.id;
        const newStatus = data.status;
        if (threatId && newStatus) {
          setThreats(prev => prev.map(t => t.id === threatId ? { ...t, status: newStatus } : t));
          if (selectedThreat?.id === threatId) {
            setSelectedThreat(prev => prev ? { ...prev, status: newStatus } : null);
          }
        }
      }
    });

    return () => {
      unsubStatus();
      unsubEvents();
    };
  }, [selectedThreat]);

  // Open threat detail modal
  const handleOpenDetail = async (threat: ThreatItem) => {
    setSelectedThreat(threat);
    setLoadingDetail(true);
    try {
      const detail = await securityApi.getThreatDetail(threat.id);
      setThreatDetail(detail);
    } catch {
      setThreatDetail(threat);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Mitigate threat action (BLOCK / QUARANTINE / RESOLVE)
  const handleMitigate = async (id: string, action: 'BLOCK' | 'RESOLVE' = 'BLOCK') => {
    setMitigatingId(id);
    try {
      await securityApi.mitigateThreat(id, action);
      setFeedback(`Threat ${id} mitigated: Origin IP quarantined in Firewall & status updated.`);
      
      // Update local state immediately
      setThreats(prev => prev.map(t => t.id === id ? { ...t, status: action === 'BLOCK' ? 'BLOCKED' : 'RESOLVED' } : t));
      if (selectedThreat?.id === id) {
        setSelectedThreat(prev => prev ? { ...prev, status: action === 'BLOCK' ? 'BLOCKED' : 'RESOLVED' } : null);
      }
      setMetrics(prev => ({
        ...prev,
        unresolved: Math.max(0, prev.unresolved - 1)
      }));

      setTimeout(() => setFeedback(null), 5000);
    } catch (e) {
      alert('Failed to apply threat mitigation rule.');
    } finally {
      setMitigatingId(null);
    }
  };

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={fetchThreats} />;
  }

  return (
    <div className="space-y-6" id="threats-module-container">
      {/* Real-time Connection Banner */}
      {realtimeStatus === 'REAL-TIME CONNECTION LOST' && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 flex items-center justify-between text-rose-200">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-300">REAL-TIME CONNECTION LOST</div>
              <div className="text-xs text-rose-300/80 mt-0.5">
                Threat correlation engine feed interrupted. Background reconnecting...
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

      {/* Action Notification Banner */}
      {feedback && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-4 flex items-center gap-3 text-emerald-200 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="text-xs font-medium">{feedback}</div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Bug className="w-5 h-5 text-amber-400" />
              <span>Correlated Threat Intelligence</span>
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
                {realtimeStatus === 'CONNECTED' ? 'CORRELATION ACTIVE' : realtimeStatus}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real threat detections correlated across multi-vector ingress attacks, SQL injection attempts, and brute-force scans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchThreats}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Refresh active threats"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(threats, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `oat_threats_export_${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Threats</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (Direct from SQL calculation) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Threats</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{metrics.total}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Critical Severity</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{metrics.critical}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">High Severity</div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">{metrics.high}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Unresolved / Active</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{metrics.unresolved}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Mitigated / Blocked</div>
          <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{Math.max(0, metrics.total - metrics.unresolved)}</div>
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
            placeholder="Search by Attacker IP, Target, Attack Type, or Threat ID..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          />
        </div>

        {/* Severity */}
        <select
          value={filterSeverity}
          onChange={e => setFilterSeverity(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">Severity: All</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">Status: All</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="BLOCKED">BLOCKED</option>
          <option value="MITIGATED">MITIGATED</option>
          <option value="INVESTIGATING">INVESTIGATING</option>
          <option value="RESOLVED">RESOLVED</option>
        </select>
      </div>

      {/* Threats Table View */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <th className="p-3 w-40">TIMESTAMP</th>
                <th className="p-3">ATTACKER IP</th>
                <th className="p-3">TARGET ASSET</th>
                <th className="p-3">ATTACK VECTOR</th>
                <th className="p-3">SEVERITY</th>
                <th className="p-3">CONFIDENCE</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && threats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span className="font-mono text-xs">Querying correlated threats from database...</span>
                  </td>
                </tr>
              ) : threats.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    <div className="text-slate-300 font-semibold">NO DATA AVAILABLE</div>
                    <p className="text-xs text-slate-500 mt-1">
                      No active threats recorded for this organization in the telemetry database.
                    </p>
                  </td>
                </tr>
              ) : (
                threats.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(t.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td className="p-3 font-semibold text-cyan-400">
                      <span>{t.sourceIp}</span>
                    </td>
                    <td className="p-3 text-slate-200">
                      <div className="font-sans font-medium">{t.affectedApplication || t.target}</div>
                    </td>
                    <td className="p-3 text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-slate-100">{t.attackType}</span>
                        {t.mitre?.techniqueId && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                            {t.mitre.techniqueId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <StatusBadge type="severity" value={t.severity} />
                    </td>
                    <td className="p-3 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full"
                            style={{ width: `${Math.min(100, t.confidence || 90)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono">{t.confidence || 90}%</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        t.status === 'BLOCKED' || t.status === 'MITIGATED'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          : t.status === 'INVESTIGATING'
                          ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                          : 'bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(t)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition"
                          title="Inspect Threat Details & ATT&CK"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {t.status !== 'BLOCKED' && t.status !== 'MITIGATED' && (
                          <button
                            onClick={() => handleMitigate(t.id, 'BLOCK')}
                            disabled={mitigatingId === t.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-sans text-[11px] font-semibold flex items-center gap-1 shadow-sm transition"
                            title="Insert emergency firewall quarantine rule"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Block IP</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Threat Deep Dive & ATT&CK Mapping */}
      {selectedThreat && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-slate-800 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <Bug className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Threat Dossier: {selectedThreat.id}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Attacker IP: <span className="text-cyan-400">{selectedThreat.sourceIp}</span> • Target: {selectedThreat.affectedApplication}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedThreat(null); setThreatDetail(null); }}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Threat Summary Card */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-200">{selectedThreat.attackType}</div>
                  <div className="flex items-center gap-2">
                    <StatusBadge type="severity" value={selectedThreat.severity} />
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      selectedThreat.status === 'BLOCKED' || selectedThreat.status === 'MITIGATED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}>
                      {selectedThreat.status}
                    </span>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {selectedThreat.summary}
                </p>
                {selectedThreat.detectionReason && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-400">
                    <span className="text-cyan-400 font-semibold">Detection Reason:</span> {selectedThreat.detectionReason}
                  </div>
                )}
              </div>

              {/* MITRE ATT&CK Framework Mapping */}
              {selectedThreat.mitre && (
                <div className="p-4 rounded-xl border border-cyan-900/60 bg-cyan-950/20 space-y-2">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span>MITRE ATT&CK Mapping</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 font-mono">Technique ID:</span>{' '}
                      <span className="font-mono font-bold text-cyan-400">{selectedThreat.mitre.techniqueId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-mono">Tactic:</span>{' '}
                      <span className="font-semibold text-slate-200">{selectedThreat.mitre.tactic}</span>
                    </div>
                    <div className="col-span-full">
                      <span className="text-slate-500 font-mono">Technique Name:</span>{' '}
                      <span className="text-slate-200 font-medium">{selectedThreat.mitre.techniqueName}</span>
                    </div>
                    <div className="col-span-full text-slate-400 text-[11px]">
                      {selectedThreat.mitre.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Correlated Event History */}
              {threatDetail?.relatedEventsDetails && threatDetail.relatedEventsDetails.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Ingress Packet Traces from {selectedThreat.sourceIp} ({threatDetail.relatedEventsDetails.length} Events)
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-900/60 overflow-hidden">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="p-2">TIME</th>
                          <th className="p-2">URI / TARGET</th>
                          <th className="p-2">ACTION</th>
                          <th className="p-2">SEVERITY</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {threatDetail.relatedEventsDetails.map((r: any) => (
                          <tr key={r.id}>
                            <td className="p-2 text-slate-400">{r.timestamp?.slice(11, 19)}</td>
                            <td className="p-2 text-slate-200 truncate max-w-[200px]">{r.uri || r.threat || r.application}</td>
                            <td className="p-2"><StatusBadge type="action" value={r.action} /></td>
                            <td className="p-2"><StatusBadge type="severity" value={r.severity} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recommended Action */}
              {selectedThreat.recommendedAction && (
                <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-800/40">
                  <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Recommended SOC Action</span>
                  </div>
                  <p className="text-slate-300 font-sans text-xs">
                    {selectedThreat.recommendedAction}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
              <button
                onClick={() => { setSelectedThreat(null); setThreatDetail(null); }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-2">
                {selectedThreat.status !== 'BLOCKED' && selectedThreat.status !== 'MITIGATED' && (
                  <>
                    <button
                      onClick={() => handleMitigate(selectedThreat.id, 'RESOLVE')}
                      disabled={mitigatingId === selectedThreat.id}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-800/60 text-xs font-semibold"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleMitigate(selectedThreat.id, 'BLOCK')}
                      disabled={mitigatingId === selectedThreat.id}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-950/50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Block IP in Firewall</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
