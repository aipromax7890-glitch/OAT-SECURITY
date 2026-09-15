import React, { useState } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  Bell, 
  Lock, 
  CheckCircle2, 
  Globe2, 
  Radio, 
  Mail 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SettingsModule: React.FC = () => {
  const { currentOrg } = useAuth();
  const [saved, setSaved] = useState(false);

  // Settings form states
  const [autoMitigation, setAutoMitigation] = useState(true);
  const [owaspStrictness, setOwaspStrictness] = useState('Paranoia Level 2 (High)');
  const [alertEmail, setAlertEmail] = useState('soc-escalation@bankmandiri.co.id');
  const [slackWebhook, setSlackWebhook] = useState('https://hooks.slack.com/services/T00/B00/XXXXX');
  const [logRetentionDays, setLogRetentionDays] = useState(365);
  const [sessionTimeoutMins, setSessionTimeoutMins] = useState(15);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>Platform Governance & Security Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure automated mitigation thresholds, notification routing, and audit retention policies.
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Security parameters committed and synced across all edge nodes.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* WAF Policy Tuning */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>WAF Core Rule Set Paranoia & Automation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">OWASP ModSecurity Paranoia Level</label>
              <select
                value={owaspStrictness}
                onChange={e => setOwaspStrictness(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
              >
                <option>Paranoia Level 1 (Baseline)</option>
                <option>Paranoia Level 2 (High - Recommended for FinTech)</option>
                <option>Paranoia Level 3 (Extreme - Rigorous Validation)</option>
                <option>Paranoia Level 4 (Maximum Strictness)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Autonomous Threat Mitigation</label>
              <select
                value={autoMitigation ? 'true' : 'false'}
                onChange={e => setAutoMitigation(e.target.value === 'true')}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
              >
                <option value="true">Active (Immediately block high-confidence heuristics)</option>
                <option value="false">Monitoring Only (Log & Alert without dropping)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Incident Alerts Routing */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Incident Alert Routing & Paging</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency SOC Email Group</label>
              <input
                type="email"
                value={alertEmail}
                onChange={e => setAlertEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Slack Security Channel Webhook</label>
              <input
                type="url"
                value={slackWebhook}
                onChange={e => setSlackWebhook(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Audit & Compliance Policies */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Compliance Retention & Session Security</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">SIEM Event Retention (Days)</label>
              <input
                type="number"
                value={logRetentionDays}
                onChange={e => setLogRetentionDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Meets PCI DSS Requirement 10.5.1 (minimum 365 days).</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Operator Session Inactivity Timeout (Minutes)</label>
              <input
                type="number"
                value={sessionTimeoutMins}
                onChange={e => setSessionTimeoutMins(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Enforces automatic logout after idle period.</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg transition"
          >
            Save Security Governance Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
