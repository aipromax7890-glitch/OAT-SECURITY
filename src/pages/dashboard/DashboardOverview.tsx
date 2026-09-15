import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Flame, 
  Server, 
  Network, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Radio, 
  Layers, 
  TrendingUp, 
  RefreshCw,
  ExternalLink,
  Cpu,
  Zap
} from 'lucide-react';
import { securityApi, telemetryStreamManager } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { SecurityEvent, SystemHealth } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DashboardOverviewProps {
  onNavigate: (view: any) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { currentOrg, isBackendOffline } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [injectingTest, setInjectingTest] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch security telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrg.id, isBackendOffline]);

  // Real-time telemetry subscription
  useEffect(() => {
    if (isBackendOffline) return;
    const unsub = telemetryStreamManager.subscribe(
      (evt: SecurityEvent) => {
        setData((prev: any) => {
          if (!prev) return prev;
          const newEvents = [evt, ...(prev.recentEvents || []).slice(0, 9)];
          const isBlocked = ['BLOCK', 'BLOCKED', 'DENY', 'DROP', 'CHALLENGE'].includes((evt.action || '').toUpperCase());
          return {
            ...prev,
            metrics: {
              ...prev.metrics,
              requestsToday: (prev.metrics?.requestsToday ?? 0) + 1,
              blockedRequests: (prev.metrics?.blockedRequests ?? 0) + (isBlocked ? 1 : 0),
              securityEventsCount: (prev.metrics?.securityEventsCount ?? 0) + 1
            },
            recentEvents: newEvents
          };
        });
      },
      () => {}
    );
    return () => unsub();
  }, [isBackendOffline]);

  const [testCycleIndex, setTestCycleIndex] = useState(0);

  const handleInjectTestEvent = async () => {
    setInjectingTest(true);
    try {
      const types = ['sqli', 'xss', 'ssh_brute'];
      const currentTestType = types[testCycleIndex % types.length];
      setTestCycleIndex(prev => prev + 1);

      await fetch('/api/dev/test-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organization-id': currentOrg.id
        },
        body: JSON.stringify({
          testType: currentTestType
        })
      });
      // Telemetry updates immediately through WebSocket; also trigger manual fetch
      setTimeout(() => fetchData(), 400);
    } catch (e) {
      console.error('Failed to trigger official test event:', e);
    } finally {
      setInjectingTest(false);
    }
  };

  if (isBackendOffline || error === 'BACKEND OFFLINE') {
    return (
      <div className="space-y-6">
        <BackendOfflineBanner onRetry={fetchData} />
        <div className="p-12 text-center border border-slate-800 rounded-2xl bg-[#0a0f1c]">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">BACKEND OFFLINE</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Telemetry service is currently disconnected. In accordance with enterprise cybersecurity specifications, no simulated or synthetic attack data is displayed.
          </p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
          >
            Retry Ingress Handshake
          </button>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-800/40 border border-slate-800"></div>
          ))}
        </div>
        <div className="h-64 rounded-xl bg-slate-800/40 border border-slate-800"></div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    protectedAppsCount: 0,
    protectedNetworksCount: 0,
    requestsToday: 0,
    blockedRequests: 0,
    activeThreats: 0,
    criticalAlerts: 0,
    securityEventsCount: 0,
    securityScore: null,
    securityScoreStatus: 'INSUFFICIENT DATA'
  };

  const health: SystemHealth = data?.systemHealth || {
    wafEngine: 'Operational',
    firewall: 'Operational',
    threatDetection: 'Operational',
    database: 'Operational',
    api: 'Operational',
    monitoring: 'Operational',
    webSocket: 'Operational',
    threatIntelligence: 'Operational',
    lastHeartbeat: new Date().toISOString()
  };

  const threatBreakdown = data?.threatOverview || { critical: 0, high: 0, medium: 0, low: 0 };
  const recentEvents: SecurityEvent[] = data?.recentEvents || [];
  const trafficHistory = data?.trafficHistory || [];

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <span>Security Posture Dashboard</span>
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Zero Trust Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry and continuous perimeter threat intelligence for {currentOrg.name}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleInjectTestEvent}
            disabled={injectingTest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900 border border-amber-800/80 transition"
            title="Inject real intrusion packet into backend ingestion pipeline"
          >
            <Zap className={`w-3.5 h-3.5 ${injectingTest ? 'animate-bounce' : ''}`} />
            <span>{injectingTest ? 'Injecting...' : 'Test Ingest Pipeline'}</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          <button
            onClick={() => onNavigate('live-traffic')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-300 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 transition"
          >
            <Radio className="w-3.5 h-3.5" />
            Live Ingress Stream
          </button>
        </div>
      </div>

      {/* 8 Required Metric Cards (Section 6) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Protected Applications */}
        <div 
          onClick={() => onNavigate('applications')}
          className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>PROTECTED APPS</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{metrics.protectedAppsCount}</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Active Perimeter Enforced</span>
          </div>
        </div>

        {/* Protected Networks */}
        <div 
          onClick={() => onNavigate('networks')}
          className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>PROTECTED NETWORKS</span>
            <Network className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">{metrics.protectedNetworksCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Configured Subnet Zones</div>
        </div>

        {/* Requests Today */}
        <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>REQUESTS TODAY</span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {(metrics.requestsToday ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-cyan-400 mt-1">Logged Telemetry Ingress</div>
        </div>

        {/* Blocked Requests */}
        <div 
          onClick={() => onNavigate('waf')}
          className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>BLOCKED REQUESTS</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {(metrics.blockedRequests ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">
            {metrics.requestsToday > 0 
              ? `${(((metrics.blockedRequests ?? 0) / metrics.requestsToday) * 100).toFixed(2)}% Dropped` 
              : '0 Malicious Drops'}
          </div>
        </div>

        {/* Active Threats */}
        <div 
          onClick={() => onNavigate('threats')}
          className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>ACTIVE THREATS</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">{metrics.activeThreats ?? 0}</div>
          <div className="text-[11px] text-slate-400 mt-1">Correlated Heuristic Clusters</div>
        </div>

        {/* Critical Alerts */}
        <div 
          onClick={() => onNavigate('incidents')}
          className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 hover:border-rose-500/40 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-rose-400 font-mono mb-2">
            <span>CRITICAL ALERTS</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">{metrics.criticalAlerts ?? 0}</div>
          <div className="text-[11px] text-rose-400/90 mt-1">Incidents Awaiting Triage</div>
        </div>

        {/* Security Events Count */}
        <div 
          onClick={() => onNavigate('security-events')}
          className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-slate-700 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>SECURITY EVENTS</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {(metrics.securityEventsCount ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">SIEM Audit Logs Recorded</div>
        </div>

        {/* Security Score */}
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-mono mb-2">
            <span>SECURITY SCORE</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {metrics.securityScore !== null && metrics.securityScore !== undefined ? (
              <>
                {metrics.securityScore} <span className="text-xs text-slate-400">/ 100</span>
              </>
            ) : (
              <span className="text-sm font-sans font-semibold text-amber-400">DATA TIDAK CUKUP</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics.securityScore !== null && metrics.securityScore !== undefined 
              ? 'Dihitung secara matematis dari telemetri aktif' 
              : 'DATA TIDAK CUKUP (INSUFFICIENT DATA)'}
          </div>
        </div>
      </div>

      {/* Middle Grid: Traffic Overview + Threat Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Overview (Section 6) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Traffic Ingress Overview (24h)</h2>
              <p className="text-xs text-slate-400">Distribution of allowed, blocked, and suspicious connections.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Allowed
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> Blocked
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Suspicious
              </span>
            </div>
          </div>

          {/* Traffic Histogram or Empty State */}
          <div className="h-52 w-full pt-4">
            {trafficHistory.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-center p-6 border-b border-slate-800 text-slate-500 font-mono text-xs">
                <div>
                  <div className="font-bold text-slate-400">NO SECURITY TELEMETRY</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-sans">
                    Ingress traffic distribution will render once sensor packets are recorded.
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-end justify-between gap-3 px-2 border-b border-slate-800">
                {trafficHistory.map((item: any, idx: number) => {
                  const maxVal = Math.max(50, ...trafficHistory.map((h: any) => h.allowed + h.blocked + h.suspicious));
                  const allowedHeight = Math.max(8, (item.allowed / maxVal) * 100);
                  const blockedHeight = Math.max(item.blocked > 0 ? 8 : 0, (item.blocked / maxVal) * 100);
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-14 hidden group-hover:block z-30 p-2 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono whitespace-nowrap shadow-xl">
                        <div>Allowed: {item.allowed.toLocaleString()}</div>
                        <div className="text-rose-400">Blocked: {item.blocked.toLocaleString()}</div>
                        <div className="text-amber-400">Suspicious: {item.suspicious.toLocaleString()}</div>
                      </div>

                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        <div 
                          style={{ height: `${allowedHeight}%` }} 
                          className="w-1/2 bg-emerald-500/80 hover:bg-emerald-400 rounded-t transition"
                        ></div>
                        <div 
                          style={{ height: `${blockedHeight}%` }} 
                          className="w-1/2 bg-rose-500 hover:bg-rose-400 rounded-t transition"
                        ></div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-2">{item.time}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Threat Overview (Section 6) */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Threat Overview by Severity</h2>
            <p className="text-xs text-slate-400 mb-4">Active telemetry triage taxonomy.</p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  <span className="text-xs font-semibold text-rose-300">Critical Threats</span>
                </div>
                <span className="text-sm font-bold font-mono text-rose-400">{threatBreakdown.critical}</span>
              </div>

              <div className="p-3 rounded-lg border border-orange-500/30 bg-orange-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span className="text-xs font-semibold text-orange-300">High Threats</span>
                </div>
                <span className="text-sm font-bold font-mono text-orange-400">{threatBreakdown.high}</span>
              </div>

              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs font-semibold text-amber-300">Medium Threats</span>
                </div>
                <span className="text-sm font-bold font-mono text-amber-400">{threatBreakdown.medium}</span>
              </div>

              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-950/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span className="text-xs font-semibold text-blue-300">Low & Info Ingress</span>
                </div>
                <span className="text-sm font-bold font-mono text-blue-400">{threatBreakdown.low}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('threats')}
            className="w-full mt-4 py-2 text-xs font-semibold text-cyan-300 bg-slate-800/80 hover:bg-slate-800 rounded-lg border border-slate-700 transition flex items-center justify-center gap-1.5"
          >
            <span>Inspect Threat Repository</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Recent Security Events Table (Section 6) */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Recent Security Events</h2>
            <p className="text-xs text-slate-400">Streamed ingress anomalies across WAF and Firewall interfaces.</p>
          </div>
          <button
            onClick={() => onNavigate('security-events')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
          >
            View All Events →
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs">
              TIDAK ADA KEJADIAN KEAMANAN YANG TERDETEKSI
              <p className="text-[11px] text-slate-600 mt-1 font-sans">
                NO SECURITY EVENTS DETECTED - Aliran telemetri aktif memantau lalu lintas perimeter.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-mono">
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">SOURCE</th>
                  <th className="p-3">DESTINATION</th>
                  <th className="p-3">APPLICATION</th>
                  <th className="p-3">THREAT</th>
                  <th className="p-3">SEVERITY</th>
                  <th className="p-3">ACTION</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {recentEvents.map(evt => {
                  const srcIp = evt.sourceIp || (evt as any).source_ip || '0.0.0.0';
                  const countryCode = evt.sourceCountryCode || (evt as any).source_country_code || 'ID';
                  const dest = evt.destination || (evt as any).destination_ip || 'Edge Gateway';
                  const threatName = evt.threat || (evt as any).threat_name || 'Suspicious Activity';
                  const actionUpper = String(evt.action || '').toUpperCase();
                  const isBlocked = actionUpper === 'BLOCK' || actionUpper === 'BLOCKED' || actionUpper === 'DENY' || actionUpper === 'DROP';
                  const statusVal = evt.status || (isBlocked ? 'Mitigated' : 'Detected');

                  return (
                    <tr key={evt.id} className="hover:bg-slate-850/50 transition">
                      <td className="p-3 text-slate-400 whitespace-nowrap">
                        {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'Just now'}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-semibold text-cyan-300">{srcIp}</span>
                        <span className="text-slate-400 ml-1.5">({countryCode})</span>
                      </td>
                      <td className="p-3 text-slate-300 whitespace-nowrap">{dest}</td>
                      <td className="p-3 text-slate-200 whitespace-nowrap">{evt.application || 'Gateway'}</td>
                      <td className="p-3 text-slate-300 max-w-xs truncate" title={threatName}>
                        {threatName}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge type="severity" value={evt.severity || 'Medium'} />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge type="action" value={evt.action || 'LOG'} />
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <StatusBadge type="status" value={statusVal} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* System Health Status Grid (Section 6) */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Core Defense System Health</span>
            </h2>
            <p className="text-xs text-slate-400">Continuous heartbeat telemetry across OAT infrastructure nodes.</p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Last check: {new Date(health.lastHeartbeat).toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'WAF Engine', status: health.wafEngine },
            { label: 'Firewall', status: health.firewall },
            { label: 'Threat Detection', status: health.threatDetection },
            { label: 'Database', status: health.database },
            { label: 'REST API', status: health.api },
            { label: 'Monitoring', status: health.monitoring },
            { label: 'Stream Socket', status: health.webSocket },
            { label: 'Threat Intel', status: health.threatIntelligence },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-center">
              <div className="text-[11px] font-medium text-slate-300 truncate mb-1.5">{item.label}</div>
              <StatusBadge type="health" value={item.status} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
