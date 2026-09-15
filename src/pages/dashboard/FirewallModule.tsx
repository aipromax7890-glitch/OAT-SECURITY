import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Plus, 
  Network, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  Filter, 
  ArrowUpDown,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { securityApi } from '../../services/api';
import { FirewallRule, NetworkInventory } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const FirewallModule: React.FC = () => {
  const { isBackendOffline } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'zones' | 'nat' | 'access'>('rules');
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);

  // New Rule Form
  const [priority, setPriority] = useState(25);
  const [source, setSource] = useState('10.240.0.0/16');
  const [destination, setDestination] = useState('10.240.20.0/24');
  const [port, setPort] = useState('443');
  const [protocol, setProtocol] = useState<'TCP' | 'UDP' | 'ICMP' | 'ANY'>('TCP');
  const [action, setAction] = useState<'ALLOW' | 'DENY' | 'LOG'>('DENY');
  const [description, setDescription] = useState('Segment DMZ traffic from Core Data Vault');

  const fetchFirewall = async () => {
    setLoading(true);
    try {
      const res = await securityApi.getFirewallData();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirewall();
  }, [isBackendOffline]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await securityApi.createFirewallRule({
        priority,
        source,
        destination,
        port,
        protocol,
        action,
        description
      });
      setShowAddRuleModal(false);
      fetchFirewall();
    } catch (err) {
      alert('Failed to save firewall rule to network controller.');
    }
  };

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={fetchFirewall} />;
  }

  const rules: FirewallRule[] = data?.rules || [];
  const zones: NetworkInventory[] = data?.networkZones || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            <span>Network Firewall & Perimeter Access Control</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Hardware-accelerated stateful packet filtering, zero-trust network zoning, and NAT routing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchFirewall}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddRuleModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Firewall Rule
          </button>
        </div>
      </div>

      {/* 6 Metric Cards (Section 8) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">FIREWALL STATUS</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">Operational</div>
          <div className="text-[10px] text-slate-500">Zero packet drops</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">ACTIVE SESSIONS</div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">{(data?.activeConnections ?? 0).toLocaleString()}</div>
          <div className="text-[10px] text-cyan-400">Stateful TCP Table</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">BLOCKED SESSIONS</div>
          <div className="text-lg font-bold font-mono text-rose-400 mt-1">{(data?.blockedConnections ?? 0).toLocaleString()}</div>
          <div className="text-[10px] text-rose-400/80">SYN / Port Scans</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">ALLOWED FLOWS</div>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">{(data?.allowedConnections ?? 0).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Verified Policies</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">THREAT EVENTS</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            {(data?.threatEventsCount ?? (data?.blockedConnections ?? 0)).toLocaleString()} Ingress
          </div>
          <div className="text-[10px] text-slate-500">Correlated to SIEM</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">RULES TRIGGERED</div>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-1">{(data?.rulesTriggeredToday ?? 0).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Today execution count</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 transition relative ${activeTab === 'rules' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Firewall Rules ({rules.length})
          {activeTab === 'rules' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"></span>}
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`pb-3 transition relative ${activeTab === 'zones' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Network Security Zones ({zones.length})
          {activeTab === 'zones' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"></span>}
        </button>
        <button
          onClick={() => setActiveTab('nat')}
          className={`pb-3 transition relative ${activeTab === 'nat' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          NAT & Port Forwarding
          {activeTab === 'nat' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"></span>}
        </button>
        <button
          onClick={() => setActiveTab('access')}
          className={`pb-3 transition relative ${activeTab === 'access' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Access Control & Protocol Whitelist
          {activeTab === 'access' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"></span>}
        </button>
      </div>

      {/* Tab 1: Firewall Rules Table (Section 8) */}
      {activeTab === 'rules' && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100">Perimeter Access Control List (ACL)</h3>
            <span className="text-xs font-mono text-slate-400">Evaluated Top-Down by Priority</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="p-3">PRIORITY</th>
                  <th className="p-3">RULE ID</th>
                  <th className="p-3">SOURCE</th>
                  <th className="p-3">DESTINATION</th>
                  <th className="p-3">PORT</th>
                  <th className="p-3">PROTOCOL</th>
                  <th className="p-3">ACTION</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">CREATED</th>
                  <th className="p-3">DESCRIPTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rules.map(r => (
                  <tr key={r.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-3 font-bold text-slate-200">{r.priority}</td>
                    <td className="p-3 text-cyan-300">{r.id}</td>
                    <td className="p-3 text-slate-200">{r.source}</td>
                    <td className="p-3 text-slate-200">{r.destination}</td>
                    <td className="p-3 text-amber-300">{r.port}</td>
                    <td className="p-3 text-slate-300 font-semibold">{r.protocol}</td>
                    <td className="p-3">
                      <StatusBadge type="action" value={r.action} />
                    </td>
                    <td className="p-3">
                      <StatusBadge type="health" value={r.status} />
                    </td>
                    <td className="p-3 text-slate-400">{r.created}</td>
                    <td className="p-3 font-sans text-slate-400 text-[11px]">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Network Zones */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {zones.map(zone => (
            <div key={zone.id} className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-slate-100">{zone.name}</div>
                <StatusBadge type="health" value={zone.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                <div><span className="text-slate-500">CIDR:</span> {zone.cidr}</div>
                <div><span className="text-slate-500">Gateway:</span> {zone.gateway}</div>
                <div><span className="text-slate-500">Devices:</span> {zone.devicesCount} nodes</div>
                <div><span className="text-slate-500">Firewall Engine:</span> {zone.firewall}</div>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Zone Type: <span className="text-cyan-300 font-mono">{zone.zone}</span></span>
                <StatusBadge type="severity" value={zone.riskLevel} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: NAT Configuration */}
      {activeTab === 'nat' && (
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Carrier-Grade NAT & Port Redirection Policies</h3>
          <p className="text-xs text-slate-400">
            Translates external Anycast Virtual IPs (VIPs) to hardened internal DMZ application backends.
          </p>

          <div className="rounded-lg border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-slate-400">
                  <th className="p-3">EXTERNAL VIP</th>
                  <th className="p-3">EXTERNAL PORT</th>
                  <th className="p-3">INTERNAL ORIGIN</th>
                  <th className="p-3">TARGET PORT</th>
                  <th className="p-3">NAT MODE</th>
                  <th className="p-3">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                <tr>
                  <td className="p-3 text-cyan-300">172.67.182.90</td>
                  <td className="p-3">443 (HTTPS)</td>
                  <td className="p-3">10.240.10.14</td>
                  <td className="p-3">8443 (mTLS)</td>
                  <td className="p-3 text-emerald-400">Destination NAT (DNAT)</td>
                  <td className="p-3"><StatusBadge type="health" value="Active" /></td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-300">104.21.78.11</td>
                  <td className="p-3">443 (HTTPS)</td>
                  <td className="p-3">10.240.10.88</td>
                  <td className="p-3">443</td>
                  <td className="p-3 text-emerald-400">Full Cone NAT</td>
                  <td className="p-3"><StatusBadge type="health" value="Active" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Access Control */}
      {activeTab === 'access' && (
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Strict Layer 4 Protocol Enforcements</h3>
          <p className="text-xs text-slate-400">
            In accordance with Zero Trust posture, all non-explicitly whitelisted protocols are dropped by default.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-xs font-semibold text-slate-200 mb-1">TCP SYN Flood Mitigation</div>
              <p className="text-xs text-slate-400">SYN Cookies enabled with sliding threshold at 150,000 pps.</p>
              <div className="mt-2 text-[10px] font-mono text-emerald-400">ACTIVE: ENFORCING</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-xs font-semibold text-slate-200 mb-1">UDP Amplification Drop</div>
              <p className="text-xs text-slate-400">Blocks unrequested NTP, DNS (53), and SNMP reflection packets.</p>
              <div className="mt-2 text-[10px] font-mono text-emerald-400">ACTIVE: ENFORCING</div>
            </div>
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-xs font-semibold text-slate-200 mb-1">ICMP Ping Sweep Suppression</div>
              <p className="text-xs text-slate-400">Suppresses external discovery pings across perimeter subnets.</p>
              <div className="mt-2 text-[10px] font-mono text-emerald-400">ACTIVE: LOGGING</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 bg-[#080d17]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0e1628] shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">Add Enterprise Firewall Rule</h3>
            <p className="text-xs text-slate-400 mb-4">Set network priority, CIDR matching, and enforcement action.</p>

            <form onSubmit={handleCreateRule} className="space-y-3 text-left">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority (1 - 1000)</label>
                  <input
                    type="number"
                    required
                    value={priority}
                    onChange={e => setPriority(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Action</label>
                  <select 
                    value={action}
                    onChange={e => setAction(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                  >
                    <option value="ALLOW">ALLOW</option>
                    <option value="DENY">DENY</option>
                    <option value="LOG">LOG</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Source (IP or CIDR)</label>
                  <input
                    type="text"
                    required
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    placeholder="10.240.0.0/16 or ANY"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Destination (IP or CIDR)</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="10.240.20.0/24 or ANY"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Port</label>
                  <input
                    type="text"
                    required
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    placeholder="443, 8443, or ANY"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Protocol</label>
                  <select 
                    value={protocol}
                    onChange={e => setProtocol(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono"
                  >
                    <option value="TCP">TCP</option>
                    <option value="UDP">UDP</option>
                    <option value="ICMP">ICMP</option>
                    <option value="ANY">ANY</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rule Description</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Isolate DMZ from Payment HSM core"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-md"
                >
                  Commit Rule to Firewall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
