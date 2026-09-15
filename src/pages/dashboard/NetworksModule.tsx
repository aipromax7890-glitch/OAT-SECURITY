import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Plus, 
  Search, 
  Flame, 
  ShieldCheck, 
  RefreshCw,
  Server,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { securityApi } from '../../services/api';
import { NetworkInventory } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const NetworksModule: React.FC = () => {
  const { isBackendOffline } = useAuth();
  const [networks, setNetworks] = useState<NetworkInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [cidr, setCidr] = useState('');
  const [gateway, setGateway] = useState('');
  const [zone, setZone] = useState('DMZ');

  const fetchNetworks = async () => {
    setLoading(true);
    try {
      const res = await securityApi.getNetworks();
      setNetworks((res as any)?.networks || (Array.isArray(res) ? res : []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, [isBackendOffline]);

  const handleAddNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await securityApi.createNetwork({
        name,
        cidr,
        gateway,
        zone
      });
      setShowAddModal(false);
      setName('');
      setCidr('');
      setGateway('');
      fetchNetworks();
    } catch (err) {
      alert('Failed to register network zone');
    }
  };

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={fetchNetworks} />;
  }

  const term = (search || '').trim().toLowerCase();
  const filtered = networks.filter(n => 
    String(n.name || '').toLowerCase().includes(term) ||
    String(n.cidr || '').includes(term) ||
    String(n.zone || '').toLowerCase().includes(term)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-400" />
            <span>Protected Networks & Subnet Zones</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Internal corporate subnets, DMZ perimeters, and VPC interconnects under stateful firewall control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNetworks}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Network Subnet
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1424] flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search subnet name, CIDR, or zone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filtered.length} Subnets Segmented
        </span>
      </div>

      {/* Network List Table (Section 10) */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                <th className="p-3">NETWORK NAME</th>
                <th className="p-3">CIDR RANGE</th>
                <th className="p-3">GATEWAY</th>
                <th className="p-3">ZONE</th>
                <th className="p-3">FIREWALL ENGINE</th>
                <th className="p-3">DEVICES</th>
                <th className="p-3">RISK LEVEL</th>
                <th className="p-3">STATUS</th>
                <th className="p-3 text-right">TRAFFIC (24H)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(net => (
                <tr key={net.id} className="hover:bg-slate-850/50 transition">
                  <td className="p-3 font-sans font-semibold text-slate-200">{net.name}</td>
                  <td className="p-3 text-cyan-300 font-bold">{net.cidr}</td>
                  <td className="p-3 text-slate-300">{net.gateway}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px]">
                      {net.zone}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400">{net.firewall}</td>
                  <td className="p-3 text-slate-300">{net.devicesCount} active hosts</td>
                  <td className="p-3">
                    <StatusBadge type="severity" value={net.riskLevel} />
                  </td>
                  <td className="p-3">
                    <StatusBadge type="health" value={net.status} />
                  </td>
                  <td className="p-3 text-right text-slate-200">{net.trafficVolume}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Subnet */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#080d17]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1628] shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">Add Protected Network Subnet</h3>
            <p className="text-xs text-slate-400 mb-4">Enroll CIDR block into central firewall perimeter routing.</p>

            <form onSubmit={handleAddNetwork} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Network Subnet Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Core Database Vault Subnet"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CIDR Block</label>
                  <input
                    type="text"
                    required
                    value={cidr}
                    onChange={e => setCidr(e.target.value)}
                    placeholder="10.240.50.0/24"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Default Gateway</label>
                  <input
                    type="text"
                    required
                    value={gateway}
                    onChange={e => setGateway(e.target.value)}
                    placeholder="10.240.50.1"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Security Zone</label>
                <select
                  value={zone}
                  onChange={e => setZone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                >
                  <option value="DMZ">DMZ (Public Ingress Proxy)</option>
                  <option value="Internal Core">Internal Core (Strict Zero Trust)</option>
                  <option value="Cloud VPC">Cloud VPC Interconnect</option>
                  <option value="Corporate Office">Corporate Office / VPN Hub</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md"
                >
                  Register & Enforce Firewall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
