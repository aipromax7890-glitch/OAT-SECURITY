import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Flame, 
  Server, 
  Network, 
  Lock, 
  Activity, 
  Globe2, 
  Zap, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import { DashboardView } from '../../components/layout/DashboardSidebar';

interface SecurityOverviewModuleProps {
  onNavigate: (view: DashboardView) => void;
}

export const SecurityOverviewModule: React.FC<SecurityOverviewModuleProps> = ({ onNavigate }) => {
  const defenseLayers = [
    {
      layer: 'Layer 1: Global Anycast Perimeter',
      desc: 'Multi-Tbps DDoS mitigation edge scrubbing and TLS 1.3 cryptographic termination.',
      status: 'Protected',
      targetView: 'firewall' as DashboardView
    },
    {
      layer: 'Layer 2: Web Application Firewall (WAF)',
      desc: 'Deep packet HTTP inspection mitigating SQLi, XSS, CSRF, and OWASP Top 10 vulnerabilities.',
      status: 'Enforced',
      targetView: 'waf' as DashboardView
    },
    {
      layer: 'Layer 3: Heuristic Threat & Bot Defense',
      desc: 'Fingerprint entropy, automated scraper detection, and credential stuffing prevention.',
      status: 'Active',
      targetView: 'threats' as DashboardView
    },
    {
      layer: 'Layer 4: Zero Trust Network Zoning',
      desc: 'Stateful Layer 3/4 segmentation separating public DMZs from core transaction vaults.',
      status: 'Segmented',
      targetView: 'networks' as DashboardView
    },
    {
      layer: 'Layer 5: Continuous SOC Telemetry & SIEM',
      desc: 'Real-time telemetry event correlation, immutable audit trails, and automated escalation.',
      status: 'Monitoring',
      targetView: 'security-events' as DashboardView
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span>Defense in Depth Security Architecture</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Holistic posture visualization across all 5 concentric rings of perimeter security.
          </p>
        </div>
      </div>

      {/* 5 Concentric Rings of Defense */}
      <div className="space-y-4">
        {defenseLayers.map((d, idx) => (
          <div
            key={idx}
            className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-cyan-500/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">RING 0{idx + 1}</span>
                <span className="text-sm font-bold text-slate-100">{d.layer}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                  {d.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">{d.desc}</p>
            </div>

            <button
              onClick={() => onNavigate(d.targetView)}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition shrink-0"
            >
              <span>Manage Layer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
