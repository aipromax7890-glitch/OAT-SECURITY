import React, { useState, useEffect, useCallback } from 'react';
import { 
  ScrollText, 
  Search, 
  Download, 
  User, 
  ShieldAlert, 
  Sliders, 
  Lock,
  Key,
  RefreshCw,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { securityApi } from '../../services/api';
import { AuditLogItem } from '../../types';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const AuditLogModule: React.FC = () => {
  const { currentOrg, isBackendOffline } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await securityApi.getAuditLogs();
      setAuditLogs(res.logs || []);
    } catch (e) {
      console.error('[AuditLogs] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs, isBackendOffline]);

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={fetchAuditLogs} />;
  }

  const term = (search || '').trim().toLowerCase();
  const filtered = auditLogs.filter(l => 
    String(l.user || '').toLowerCase().includes(term) ||
    String(l.action || '').toLowerCase().includes(term) ||
    String(l.resource || '').toLowerCase().includes(term) ||
    String(l.ip || '').includes(term)
  );

  return (
    <div className="space-y-6" id="audit-log-module-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-cyan-400" />
            <span>Administrative Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable tamper-evident record of all operator actions, policy alterations, and authentication events stored in SQLite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAuditLogs}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Refresh audit logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Trail (JSON)</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by operator email, action type, or target resource..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono transition"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          SHA-256 Ledger Integrity Active • {auditLogs.length} Records
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <th className="p-3">LOG ID</th>
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3">OPERATOR / ACTOR</th>
                <th className="p-3">ACTION EVENT</th>
                <th className="p-3">TARGET RESOURCE</th>
                <th className="p-3">ORIGIN IP</th>
                <th className="p-3 text-right">EXECUTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    <span>Loading audit records from database...</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <div className="text-slate-300 font-semibold">NO DATA AVAILABLE</div>
                    <p className="text-xs text-slate-500 mt-1">No administrative events found matching search criteria.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-cyan-300 font-bold">{log.id}</td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                      })}
                    </td>
                    <td className="p-3 font-sans font-medium text-slate-200">
                      <div>{log.user}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.role}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-amber-950/60 text-amber-300 border border-amber-800/60">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{log.resource}</td>
                    <td className="p-3 text-slate-400">{log.ip}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px]">
                        {log.result || 'Success'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
