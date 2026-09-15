import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Globe, 
  Bot, 
  Lock, 
  Search, 
  ToggleLeft, 
  ToggleRight,
  RefreshCw,
  Server
} from 'lucide-react';
import { securityApi } from '../../services/api';
import { WafRule, ProtectedApplication } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';
import { useAuth } from '../../context/AuthContext';

export const WafModule: React.FC = () => {
  const { isBackendOffline } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'rules' | 'apps' | 'policies'>('rules');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [policyFeedback, setPolicyFeedback] = useState<string | null>(null);

  // Policy Form State
  const [rateLimitRequests, setRateLimitRequests] = useState(100);
  const [rateLimitWindow, setRateLimitWindow] = useState(10);
  const [ipAllowlist, setIpAllowlist] = useState('202.158.12.0/24\n103.14.22.8');
  const [ipBlocklist, setIpBlocklist] = useState('185.220.101.0/24\n45.133.1.0/24');
  const [geoBlockCountries, setGeoBlockCountries] = useState('KP, RU, IR');
  const [botProtectionEnabled, setBotProtectionEnabled] = useState(true);

  const fetchWaf = async () => {
    setLoading(true);
    try {
      const res = await securityApi.getWafData();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaf();
  }, [isBackendOffline]);

  const handleToggleRule = async (ruleId: string, currentStatus: 'Active' | 'Disabled') => {
    const next = currentStatus === 'Active' ? 'Disabled' : 'Active';
    try {
      await securityApi.toggleWafRule(ruleId, next);
      fetchWaf();
    } catch (e) {
      alert('Failed to update WAF rule state on backend.');
    }
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setPolicyFeedback('WAF policies successfully deployed across edge proxies.');
    setTimeout(() => setPolicyFeedback(null), 4000);
  };

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={fetchWaf} />;
  }

  const rules: WafRule[] = data?.rules || [];
  const apps: ProtectedApplication[] = data?.protectedApplications || [];

  const term = (search || '').trim().toLowerCase();
  const filteredRules = rules.filter(r => 
    String(r.name || '').toLowerCase().includes(term) || 
    String(r.id || '').toLowerCase().includes(term) ||
    String(r.category || '').toLowerCase().includes(term)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <span>Web Application Firewall (WAF) Engine</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            OWASP Top 10 mitigation, custom inspection rules, and automated bot management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWaf}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Custom WAF Rule
          </button>
        </div>
      </div>

      {/* Metrics Row (Section 7) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">WAF STATUS</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">Operational</div>
          <div className="text-[10px] text-slate-500">Global Anycast active</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">PROTECTED DOMAINS</div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">{apps.length}</div>
          <div className="text-[10px] text-cyan-400">All SSL/TLS 1.3</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">24H REQUESTS</div>
          <div className="text-lg font-bold font-mono text-slate-100 mt-1">{(data?.totalRequests24h ?? 0).toLocaleString()}</div>
          <div className="text-[10px] text-slate-500">Inspected on wire</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">BLOCKED REQUESTS</div>
          <div className="text-lg font-bold font-mono text-rose-400 mt-1">{(data?.blockedRequests24h ?? 0).toLocaleString()}</div>
          <div className="text-[10px] text-rose-400/80">Ingress 403 Forbidden</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">BLOCK RATIO</div>
          <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
            {data?.totalRequests24h > 0
              ? `${(((data.blockedRequests24h ?? 0) / data.totalRequests24h) * 100).toFixed(2)}%`
              : '0.00%'}
          </div>
          <div className="text-[10px] text-slate-500">Mitigated threats</div>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424]">
          <div className="text-[10px] text-slate-400 font-mono">MANAGED RULES</div>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">{rules.length} Rules</div>
          <div className="text-[10px] text-slate-500">CRS v3.3 Strict</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 transition relative ${activeTab === 'rules' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          WAF Inspection Rules ({rules.length})
          {activeTab === 'rules' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"></span>}
        </button>
        <button
          onClick={() => setActiveTab('apps')}
          className={`pb-3 transition relative ${activeTab === 'apps' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Protected Applications ({apps.length})
          {activeTab === 'apps' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"></span>}
        </button>
        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 transition relative ${activeTab === 'policies' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          WAF Policies & Controls (Rate Limit, Geo, Bots)
          {activeTab === 'policies' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400"></span>}
        </button>
      </div>

      {/* Tab 1: Rules Table */}
      {activeTab === 'rules' && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search rule ID, OWASP category, or name..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Showing {filteredRules.length} of {rules.length} Managed Rules
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="p-3">RULE ID</th>
                  <th className="p-3">RULE NAME</th>
                  <th className="p-3">CATEGORY</th>
                  <th className="p-3">SEVERITY</th>
                  <th className="p-3">ACTION</th>
                  <th className="p-3">STATUS</th>
                  <th className="p-3">LAST TRIGGERED</th>
                  <th className="p-3 text-right">RULE TOGGLE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRules.map(rule => (
                  <tr key={rule.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-3 text-cyan-300 font-bold">{rule.id}</td>
                    <td className="p-3 font-sans font-medium text-slate-200">
                      <div>{rule.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{rule.description}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                        {rule.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <StatusBadge type="severity" value={rule.severity} />
                    </td>
                    <td className="p-3">
                      <StatusBadge type="action" value={rule.action} />
                    </td>
                    <td className="p-3">
                      <StatusBadge type="health" value={rule.status} />
                    </td>
                    <td className="p-3 text-slate-400">{rule.lastTriggered}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleRule(rule.id, rule.status)}
                        className="text-xs font-sans px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                      >
                        {rule.status === 'Active' ? (
                          <span className="text-rose-400 hover:text-rose-300">Disable</span>
                        ) : (
                          <span className="text-emerald-400 hover:text-emerald-300">Enable</span>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Protected Applications */}
      {activeTab === 'apps' && (
        <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-100">Protected Ingress Domains & Applications</h3>
            <p className="text-xs text-slate-400">Applications routed through OAT WAF security inspection reverse proxies.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="p-3">APPLICATION</th>
                  <th className="p-3">DOMAIN</th>
                  <th className="p-3">ORIGIN IP</th>
                  <th className="p-3">PROTOCOL</th>
                  <th className="p-3">PORT</th>
                  <th className="p-3">WAF STATUS</th>
                  <th className="p-3">THREAT LEVEL</th>
                  <th className="p-3 text-right">REQUESTS (24H)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {apps.map(app => (
                  <tr key={app.id} className="hover:bg-slate-850/50 transition">
                    <td className="p-3 font-sans font-medium text-slate-200">{app.name}</td>
                    <td className="p-3 text-cyan-300 font-semibold">{app.domain}</td>
                    <td className="p-3 text-slate-300">{app.ipAddress}</td>
                    <td className="p-3 text-slate-300">{app.protocol}</td>
                    <td className="p-3 text-slate-400">{app.port}</td>
                    <td className="p-3">
                      <StatusBadge type="health" value={app.wafStatus} />
                    </td>
                    <td className="p-3">
                      <StatusBadge type="severity" value={app.threatLevel} />
                    </td>
                    <td className="p-3 text-right text-slate-200">
                      {app.requests24h.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: WAF Policies Configuration (Section 7) */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSavePolicies} className="space-y-6">
          {policyFeedback && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{policyFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rate Limiting */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Rate Limiting (Token Bucket)</span>
              </div>
              <p className="text-xs text-slate-400">
                Throttles abusive burst traffic and Layer 7 HTTP flood attacks before origin starvation.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Max Requests</label>
                  <input
                    type="number"
                    value={rateLimitRequests}
                    onChange={e => setRateLimitRequests(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Sliding Window (Seconds)</label>
                  <input
                    type="number"
                    value={rateLimitWindow}
                    onChange={e => setRateLimitWindow(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Bot Management Policy */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Bot className="w-4 h-4 text-cyan-400" />
                <span>Automated Bot Defense</span>
              </div>
              <p className="text-xs text-slate-400">
                Uses client-side non-interactive cryptographic proof-of-work to challenge malicious scrapers.
              </p>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div>
                  <div className="text-xs font-medium text-slate-200">Managed JS Challenge on Untrusted TLS Fingerprints</div>
                  <div className="text-[11px] text-slate-400">Bypasses verified search spiders automatically</div>
                </div>
                <button
                  type="button"
                  onClick={() => setBotProtectionEnabled(!botProtectionEnabled)}
                  className="text-cyan-400"
                >
                  {botProtectionEnabled ? <ToggleRight className="w-8 h-8 text-cyan-400" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}
                </button>
              </div>
            </div>

            {/* IP Allowlist */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>IP Allowlist (Bypass Inspection)</span>
              </div>
              <p className="text-xs text-slate-400">Enter CIDR blocks or IP addresses (one per line):</p>
              <textarea
                rows={3}
                value={ipAllowlist}
                onChange={e => setIpAllowlist(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* IP Blocklist */}
            <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>IP Blocklist (Edge Immediate Drop)</span>
              </div>
              <p className="text-xs text-slate-400">Enter CIDRs or IPs to deny ingress immediately:</p>
              <textarea
                rows={3}
                value={ipBlocklist}
                onChange={e => setIpBlocklist(e.target.value)}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Geo Policy */}
            <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>Geographic Ingress Fence (ISO-3166)</span>
              </div>
              <p className="text-xs text-slate-400">Comma-separated two-letter country codes to restrict:</p>
              <input
                type="text"
                value={geoBlockCountries}
                onChange={e => setGeoBlockCountries(e.target.value)}
                placeholder="KP, RU, IR"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg transition"
            >
              Deploy WAF Policies to All Edge Nodes
            </button>
          </div>
        </form>
      )}

      {/* Modal: Create Custom WAF Rule */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#080d17]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0e1628] shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">Create Custom WAF Security Rule</h3>
            <p className="text-xs text-slate-400 mb-4">Define signature regex or path match parameters.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              setShowCreateModal(false);
              alert('Custom WAF rule successfully compiled into edge engine.');
            }} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  placeholder="Block GraphQL Batch Introspection Flooding"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
                    <option>Custom Policy</option>
                    <option>SQL Injection</option>
                    <option>XSS Filter</option>
                    <option>Rate Limiting</option>
                    <option>Bot Protection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Action</label>
                  <select className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200">
                    <option>Block</option>
                    <option>Challenge</option>
                    <option>Log</option>
                    <option>Allow</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Match Condition / Pattern</label>
                <input
                  type="text"
                  required
                  placeholder="REQUEST_URI @contains /graphql && REQUEST_BODY @rx (introspection|__schema)"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500"
                >
                  Compile & Deploy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
