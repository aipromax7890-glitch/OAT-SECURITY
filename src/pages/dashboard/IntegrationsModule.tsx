import React, { useState } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  ExternalLink, 
  Key, 
  Webhook, 
  Bell, 
  Plus, 
  ShieldCheck 
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const IntegrationsModule: React.FC = () => {
  const [integrations, setIntegrations] = useState([
    { name: 'Splunk Enterprise SIEM', type: 'SIEM Log Forwarder', status: 'Active', protocol: 'HEC over TLS', eventsPerSec: '1,450 eps' },
    { name: 'Elasticsearch / Kibana', type: 'Telemetry Storage', status: 'Active', protocol: 'Beats / OpenTelemetry', eventsPerSec: '3,800 eps' },
    { name: 'Datadog Cloud Monitoring', type: 'APM & Metrics', status: 'Active', protocol: 'Agent API', eventsPerSec: '820 eps' },
    { name: 'Slack Enterprise SOC Alerts', type: 'Notification Hook', status: 'Active', protocol: 'Webhook (HTTPS)', eventsPerSec: 'On Incident' },
    { name: 'PagerDuty On-Call Paging', type: 'Incident Response', status: 'Active', protocol: 'Events API v2', eventsPerSec: 'P1 / Critical' },
    { name: 'IBM QRadar SIEM', type: 'Log Collector', status: 'Standby', protocol: 'Syslog (RFC 5424)', eventsPerSec: '0 eps' },
  ]);

  const [apiKey, setApiKey] = useState('oat_sec_live_9a8f4c21b3e77018d992a014e8c1');
  const [showKey, setShowKey] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleRotateKey = () => {
    const newKey = 'oat_sec_live_' + crypto.randomUUID().replace(/-/g, '');
    setApiKey(newKey);
    setNotificationMsg('Ingress API Key rotated successfully. Update SIEM collector configs.');
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {notificationMsg && (
        <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-700/60 text-cyan-300 text-xs font-mono flex items-center justify-between">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <span>SIEM Integrations & Ingress Webhooks</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time event streaming connectors for Splunk, Elastic, QRadar, and incident notification systems.
          </p>
        </div>

        <button
          onClick={() => {
            setNotificationMsg('New SIEM connector setup wizard initialized.');
            setTimeout(() => setNotificationMsg(null), 3000);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Add SIEM Connector
        </button>
      </div>

      {/* API Key Management */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">Enterprise REST & Ingress Ingestion API Key</h2>
          </div>
          <button
            onClick={handleRotateKey}
            className="text-xs text-rose-400 hover:text-rose-300 font-mono"
          >
            Rotate Secret Key
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            readOnly
            value={apiKey}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs font-mono text-cyan-300 select-all focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700"
          >
            {showKey ? 'Hide' : 'Reveal'}
          </button>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((item, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-100">{item.name}</span>
                <StatusBadge type="health" value={item.status} size="sm" />
              </div>
              <div className="text-xs text-slate-400">{item.type}</div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-xs font-mono flex items-center justify-between text-slate-400">
              <span>{item.protocol}</span>
              <span className="text-cyan-400">{item.eventsPerSec}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
