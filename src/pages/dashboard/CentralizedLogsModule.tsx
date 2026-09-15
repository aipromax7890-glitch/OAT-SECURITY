import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Terminal, 
  Play, 
  Pause, 
  Trash2, 
  Filter, 
  Search, 
  Download, 
  RefreshCw, 
  ArrowDown, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Wifi, 
  WifiOff, 
  Copy, 
  FileText,
  X,
  ChevronRight
} from 'lucide-react';
import { securityApi, globalRealtimeClient, RealtimeStreamStatus } from '../../services/api';
import { LogEntry } from '../../types';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const CentralizedLogsModule: React.FC = () => {
  const { isBackendOffline, currentOrg } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [metrics, setMetrics] = useState<{
    total: number;
    critical: number;
    error: number;
    warn: number;
    info: number;
    debug: number;
  }>({
    total: 0,
    critical: 0,
    error: 0,
    warn: 0,
    info: 0,
    debug: 0
  });

  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStreamStatus>('CONNECTED');

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initial fetch of logs from database
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await securityApi.getLogs({
        level: levelFilter !== 'ALL' ? levelFilter : undefined,
        source: sourceFilter !== 'ALL' ? sourceFilter : undefined,
        search: search.trim() ? search.trim() : undefined,
        page: 1,
        limit: 100
      });

      const loadedLogs = res.logs || [];
      setLogs(loadedLogs);
      setTotalCount(res.total || loadedLogs.length);
      if (res.metrics) {
        setMetrics(res.metrics);
      }
    } catch (e) {
      console.error('[CentralizedLogs] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [levelFilter, sourceFilter, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, isBackendOffline]);

  // Real-time log streaming via SSE & WebSocket
  useEffect(() => {
    if (isBackendOffline) {
      setRealtimeStatus('REAL-TIME CONNECTION LOST');
      return;
    }

    const unsubStatus = globalRealtimeClient.onStatusChange((status) => {
      setRealtimeStatus(status);
    });

    // 1. WebSocket listener for live log events
    const unsubWs = globalRealtimeClient.subscribe((msg: any) => {
      if (!isStreaming) return;
      if (!msg) return;

      const type = msg.type || '';
      const data = msg.data || msg;

      if (type === 'log.created' || type === 'log' || (data.level && data.message)) {
        const newLog: LogEntry = {
          id: data.id || `LOG-${Date.now()}-${Math.floor(Math.random()*1000)}`,
          timestamp: data.timestamp || new Date().toISOString(),
          level: data.level || 'INFO',
          source: data.source || 'system',
          eventType: data.eventType || data.event_type || 'audit',
          message: data.message || '',
          host: data.host,
          ip: data.ip,
          correlationId: data.correlationId || data.correlation_id,
          metadata: data.metadata,
          rawLog: data.rawLog || data.raw_log
        };

        setLogs(prev => {
          if (prev.some(l => l.id === newLog.id)) return prev;
          return [newLog, ...prev.slice(0, 199)]; // Keep latest 200 logs
        });

        setTotalCount(prev => prev + 1);
        setMetrics(prev => ({
          ...prev,
          total: prev.total + 1,
          critical: newLog.level === 'CRITICAL' ? prev.critical + 1 : prev.critical,
          error: newLog.level === 'ERROR' ? prev.error + 1 : prev.error,
          warn: newLog.level === 'WARN' ? prev.warn + 1 : prev.warn,
          info: newLog.level === 'INFO' ? prev.info + 1 : prev.info
        }));
      }
    });

    // 2. Dedicated SSE Fallback Stream for logs endpoint: /api/logs/stream
    try {
      const sse = new EventSource(`/api/logs/stream?org=${encodeURIComponent(currentOrg?.id || 'org-mandiri')}`);
      eventSourceRef.current = sse;

      sse.onmessage = (event) => {
        if (!isStreaming) return;
        try {
          const payload = JSON.parse(event.data);
          const data = payload.data || payload;
          if (data && data.message) {
            const newLog: LogEntry = {
              id: data.id || `LOG-${Date.now()}`,
              timestamp: data.timestamp || new Date().toISOString(),
              level: data.level || 'INFO',
              source: data.source || 'system',
              eventType: data.eventType || data.event_type || 'audit',
              message: data.message,
              host: data.host,
              ip: data.ip,
              correlationId: data.correlationId || data.correlation_id,
              metadata: data.metadata
            };

            setLogs(prev => {
              if (prev.some(l => l.id === newLog.id)) return prev;
              return [newLog, ...prev.slice(0, 199)];
            });
          }
        } catch (err) {
          // ignore parsing error on ping
        }
      };

      sse.onerror = () => {
        // SSE disconnected, WebSocket handles fallback
      };
    } catch (e) {
      console.warn('[Logs SSE] init error', e);
    }

    return () => {
      unsubStatus();
      unsubWs();
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isStreaming, isBackendOffline, currentOrg]);

  // Scroll to bottom on autoScroll if user toggled
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={fetchLogs} />;
  }

  const getLevelColor = (level: string) => {
    switch (String(level).toUpperCase()) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/80 border-rose-800';
      case 'ERROR':
        return 'text-red-400 bg-red-950/80 border-red-800';
      case 'WARN':
      case 'WARNING':
        return 'text-amber-400 bg-amber-950/80 border-amber-800';
      case 'INFO':
        return 'text-cyan-400 bg-cyan-950/80 border-cyan-800';
      case 'DEBUG':
        return 'text-slate-400 bg-slate-900 border-slate-800';
      default:
        return 'text-slate-300 bg-slate-900 border-slate-800';
    }
  };

  return (
    <div className="space-y-6" id="centralized-logs-container">
      {/* Real-time Connection Banner if Lost */}
      {realtimeStatus === 'REAL-TIME CONNECTION LOST' && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 flex items-center justify-between text-rose-200">
          <div className="flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-rose-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-300">REAL-TIME CONNECTION LOST</div>
              <div className="text-xs text-rose-300/80 mt-0.5">
                Centralized log streaming daemon disconnected. Automatic reconnection active.
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
              <Terminal className="w-5 h-5 text-cyan-400" />
              <span>Real-Time Centralized Log Console</span>
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-medium tracking-wide bg-slate-900 border-slate-800">
              <span className={`w-2 h-2 rounded-full ${
                isStreaming && realtimeStatus === 'CONNECTED'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400'
              }`} />
              <span className={isStreaming && realtimeStatus === 'CONNECTED' ? 'text-emerald-300' : 'text-amber-300'}>
                {isStreaming && realtimeStatus === 'CONNECTED' ? 'STREAMING REAL-TIME' : 'STREAM PAUSED'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time unified log aggregator ingesting WAF edge logs, Suricata IDS telemetry, host security audits, and firewall drop traces.
          </p>
        </div>

        {/* Controls Toolbar */}
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
            <span>{isStreaming ? 'Pause Stream' : 'Resume Live'}</span>
          </button>

          <button
            onClick={() => setLogs([])}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-300 hover:border-rose-900 transition"
            title="Clear current log buffer"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
            title="Reload recent logs from database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `oat_centralized_logs_${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Logs</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (Direct from SQL calculation) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Stored Logs</div>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">{metrics.total.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Critical</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">{metrics.critical.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-red-400 uppercase tracking-wider">Error</div>
          <div className="text-xl font-bold font-mono text-red-300 mt-1">{metrics.error.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">Warning</div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-1">{metrics.warn.toLocaleString()}</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[11px] font-medium text-cyan-400 uppercase tracking-wider">Info</div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{metrics.info.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search log message, correlation ID, host, or source IP..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 transition font-mono"
          />
        </div>

        {/* Level */}
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">Severity Level: All</option>
          <option value="CRITICAL">CRITICAL</option>
          <option value="ERROR">ERROR</option>
          <option value="WARN">WARN</option>
          <option value="INFO">INFO</option>
          <option value="DEBUG">DEBUG</option>
        </select>

        {/* Source */}
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
        >
          <option value="ALL">Source Daemon: All</option>
          <option value="waf">WAF Edge</option>
          <option value="firewall">Firewall Filter</option>
          <option value="suricata">Suricata IDS</option>
          <option value="system">Kernel / System</option>
          <option value="auth">IAM / Auth</option>
        </select>
      </div>

      {/* Real-time Log Stream Terminal View */}
      <div className="rounded-xl border border-slate-800 bg-[#080d17] overflow-hidden flex flex-col h-[560px]">
        {/* Terminal Title Bar */}
        <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[11px] font-mono text-slate-400 ml-2">
              /var/log/oat-security/unified-telemetry.pipe
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Buffered: <span className="text-cyan-400 font-semibold">{logs.length}</span> entries
            </span>
          </div>
        </div>

        {/* Terminal Log Output List */}
        <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1 custom-scrollbar">
          {loading && logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
              <span>Querying database logs & subscribing to stream...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Terminal className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <div className="text-slate-300 font-semibold">NO DATA AVAILABLE</div>
              <p className="text-xs text-slate-500 mt-1">
                No logs matching the query parameters have arrived yet.
              </p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="p-2 rounded hover:bg-slate-900/80 cursor-pointer transition border border-transparent hover:border-slate-800 flex items-start gap-2.5 group"
              >
                {/* Timestamp */}
                <span className="text-slate-500 whitespace-nowrap select-none">
                  {new Date(log.timestamp).toISOString().slice(11, 23)}
                </span>

                {/* Level Badge */}
                <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>

                {/* Source Badge */}
                <span className="px-1.5 py-0.2 rounded text-[10px] uppercase bg-slate-900 text-slate-400 border border-slate-800">
                  {log.source}
                </span>

                {/* Log Message */}
                <span className="text-slate-300 flex-1 break-all leading-tight group-hover:text-cyan-200">
                  {log.message}
                </span>

                {/* Host or IP */}
                {log.ip && (
                  <span className="text-slate-500 text-[10px] whitespace-nowrap">
                    [{log.ip}]
                  </span>
                )}

                <Eye className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition flex-shrink-0 mt-0.5" />
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Modal: Detailed Log Inspector */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0d1424] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">
                    Log Entry Details: {selectedLog.id}
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {new Date(selectedLog.timestamp).toISOString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Severity Level</div>
                  <div className={`mt-1 font-bold ${getLevelColor(selectedLog.level)} inline-block px-2 py-0.5 rounded border text-[11px]`}>
                    {selectedLog.level}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Subsystem Source</div>
                  <div className="text-slate-200 font-bold mt-1 uppercase">{selectedLog.source}</div>
                </div>
                {selectedLog.ip && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Source IP Address</div>
                    <div className="text-cyan-300 font-bold mt-1">{selectedLog.ip}</div>
                  </div>
                )}
                {selectedLog.correlationId && (
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Correlation Trace ID</div>
                    <div className="text-slate-300 font-bold mt-1 flex items-center justify-between">
                      <span className="truncate">{selectedLog.correlationId}</span>
                      <button
                        onClick={() => copyToClipboard(selectedLog.correlationId || '', selectedLog.id)}
                        className="text-cyan-400 hover:text-cyan-300 ml-2"
                      >
                        {copiedId === selectedLog.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Decoded Telemetry Message
                </div>
                <div className="p-3 rounded-lg bg-[#070b14] border border-slate-800 text-slate-200 whitespace-pre-wrap break-all leading-relaxed">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Metadata Attributes
                  </div>
                  <pre className="p-3 rounded-lg bg-[#070b14] border border-slate-800 text-cyan-300 text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
              <button
                onClick={() => setSelectedLog(null)}
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
