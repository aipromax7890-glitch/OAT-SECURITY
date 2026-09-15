import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Globe2, 
  ShieldAlert, 
  PieChart, 
  ArrowUpRight,
  RefreshCw,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { securityApi } from '../../services/api';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const AnalyticsModule: React.FC = () => {
  const { isBackendOffline } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await securityApi.getAnalytics();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [isBackendOffline]);

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={fetchAnalytics} />;
  }

  const topAttackingIps = data?.topAttackingIps || [];
  const topTargetedApps = data?.topTargetedApps || [];
  const responseCodes = data?.responseCodes || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Security Telemetry Analytics & Forensics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated HTTP ingress statistics, geographic threat concentration, and protocol responses.
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Aggregates
        </button>
      </div>

      {/* Top Attacking IPs & Targeted Apps (Section 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Attacking IPs */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Top Malicious Ingress Sources (24h)</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Total Block Drops</span>
          </div>

          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {topAttackingIps.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                NO SECURITY EVENTS DETECTED
                <p className="text-[11px] text-slate-600 mt-1 font-sans">No malicious ingress IP clusters recorded in database telemetry.</p>
              </div>
            ) : (
              topAttackingIps.map((item: any, i: number) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-slate-200 font-bold flex items-center gap-2">
                      <span className="text-cyan-300">{item.ip}</span>
                      <span className="text-slate-400 text-[10px] font-normal">({item.country} • {item.asn})</span>
                    </div>
                    <div className="text-[11px] text-rose-400/90 mt-0.5">{item.threat}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-rose-400 font-bold">{item.count.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">packets dropped</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Targeted Applications */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Top Targeted Applications & APIs</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Threat Ingress Load</span>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs">
            {topTargetedApps.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-mono">
                NO TARGETED APPS RECORDED
                <p className="text-[11px] text-slate-600 mt-1 font-sans">Applications configured in inventory have zero malicious ingress attacks.</p>
              </div>
            ) : (
              topTargetedApps.map((app: any, i: number) => (
                <div key={i} className="py-2.5 flex items-center justify-between font-mono">
                  <div>
                    <div className="text-slate-200 font-medium font-sans">{app.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {app.requests.toLocaleString()} total ingress requests
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-rose-400 font-bold">{app.blocked.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">{app.pctBlocked} filtered</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* HTTP Response Code Distribution (Section 14) */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
        <h2 className="text-sm font-semibold text-slate-100">Edge HTTP Status Code Breakdown (24h)</h2>
        <p className="text-xs text-slate-400">
          Proves perimeter efficacy: illegitimate traffic is rejected with HTTP 403 Forbidden before reaching origin compute.
        </p>

        {responseCodes.length === 0 ? (
          <div className="p-6 text-center text-slate-500 font-mono border border-slate-800 rounded-lg bg-slate-900/40">
            NO PROTOCOL RESPONSE CODES LOGGED
            <p className="text-[11px] text-slate-600 mt-1 font-sans">Status codes will be tabulated once HTTP ingress requests traverse the perimeter.</p>
          </div>
        ) : (
          <>
            <div className="h-6 w-full rounded-full overflow-hidden flex bg-slate-900 border border-slate-800">
              {responseCodes.map((rc: any, idx: number) => (
                <div
                  key={idx}
                  style={{ width: rc.pct }}
                  className={`${rc.color} h-full`}
                  title={`${rc.code}: ${rc.count.toLocaleString()} (${rc.pct})`}
                ></div>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 font-mono text-xs">
              {responseCodes.map((rc: any, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${rc.color}`}></span>
                    <span className="text-slate-200 font-semibold">{rc.code}</span>
                  </div>
                  <div className="text-base font-bold text-slate-100">{rc.count.toLocaleString()}</div>
                  <div className="text-[11px] text-slate-400">{rc.pct} of all ingress</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
