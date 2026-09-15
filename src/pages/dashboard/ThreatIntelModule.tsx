import React, { useState } from 'react';
import { 
  Globe2, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink,
  Download,
  CheckCircle2,
  Database
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const ThreatIntelModule: React.FC = () => {
  const [search, setSearch] = useState('');
  const [cveFeeds, setCveFeeds] = useState([
    { cve: 'CVE-2024-21413', score: '9.8', severity: 'Critical', desc: 'Microsoft Outlook Remote Code Execution Vulnerability (MonikerLink)', status: 'WAF Rule Enforced' },
    { cve: 'CVE-2024-3400', score: '10.0', severity: 'Critical', desc: 'Palo Alto Networks PAN-OS Command Injection Vulnerability', status: 'Ingress Signature Active' },
    { cve: 'CVE-2024-27198', score: '9.8', severity: 'Critical', desc: 'JetBrains TeamCity Authentication Bypass Vulnerability', status: 'WAF Rule Enforced' },
    { cve: 'CVE-2024-21887', score: '9.1', severity: 'High', desc: 'Ivanti Connect Secure Command Injection in Web Components', status: 'WAF Rule Enforced' },
    { cve: 'CVE-2023-44487', score: '7.5', severity: 'High', desc: 'HTTP/2 Rapid Reset Distributed Denial of Service Attack Vector', status: 'Anycast Scrubbing Enforced' }
  ]);

  const [activeFeeds, setActiveFeeds] = useState([
    { name: 'OAT Global Threat Sensor Network', entries: '1.4M IOCs', lastSync: '1 minute ago', status: 'Operational' },
    { name: 'FS-ISAC Financial Sector Threat Feed', entries: '420K IOCs', lastSync: '12 minutes ago', status: 'Operational' },
    { name: 'National CSIRT Sovereign Feed', entries: '180K IOCs', lastSync: '25 minutes ago', status: 'Operational' },
    { name: 'CISA Known Exploited Vulnerabilities (KEV)', entries: '1,120 CVEs', lastSync: '1 hour ago', status: 'Operational' },
    { name: 'Spamhaus DROP / EDROP Ingress Network', entries: '85K Subnets', lastSync: '3 hours ago', status: 'Operational' }
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-cyan-400" />
            <span>Threat Intelligence & IOC Synchronization</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous threat feed synchronization from global CERTs, financial sector ISACs, and proprietary honeypots.
          </p>
        </div>

        <button
          onClick={() => alert('Threat intelligence feeds successfully synchronized.')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sync Threat Feeds Now
        </button>
      </div>

      {/* Synchronized Feeds */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <span>Synchronized Threat Feeds & ISAC Feeds</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeFeeds.map((feed, idx) => (
            <div key={idx} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 truncate">{feed.name}</span>
                <StatusBadge type="health" value={feed.status} size="sm" />
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-cyan-300 font-bold">{feed.entries}</span>
                <span className="text-[10px] text-slate-400">{feed.lastSync}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CVE Exploit Mitigation Matrix */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Critical CVE Threat Signatures in Active Mitigation</h3>
            <p className="text-xs text-slate-400">Zero-day and N-day exploit vectors blocked by OAT WAF rule configurations.</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            100% Perimeter Coverage
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                <th className="p-3">CVE IDENTIFIER</th>
                <th className="p-3">CVSS SCORE</th>
                <th className="p-3">SEVERITY</th>
                <th className="p-3">VULNERABILITY DESCRIPTION</th>
                <th className="p-3 text-right">OAT DEFENSE STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cveFeeds.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-850/50 transition">
                  <td className="p-3 font-bold text-cyan-300">{c.cve}</td>
                  <td className="p-3 text-rose-400 font-bold">{c.score}</td>
                  <td className="p-3">
                    <StatusBadge type="severity" value={c.severity} />
                  </td>
                  <td className="p-3 font-sans text-slate-300 text-xs">{c.desc}</td>
                  <td className="p-3 text-right">
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px]">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
