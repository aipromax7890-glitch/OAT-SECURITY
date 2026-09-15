import React from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Flame, 
  Server, 
  Network, 
  Radio, 
  Activity, 
  FileText, 
  Users, 
  Sliders, 
  Sparkles, 
  FileCode2, 
  BarChart3, 
  Globe2, 
  CreditCard, 
  Layers, 
  Search, 
  FileCheck2, 
  Bug, 
  Workflow, 
  ScrollText,
  ShieldCheck,
  Zap,
  Lock,
  Terminal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type DashboardView = 
  | 'dashboard'
  | 'security-overview'
  | 'waf'
  | 'firewall'
  | 'applications'
  | 'networks'
  | 'threats'
  | 'security-events'
  | 'live-traffic'
  | 'logs'
  | 'analytics'
  | 'threat-intel'
  | 'incidents'
  | 'reports'
  | 'users-roles'
  | 'integrations'
  | 'billing'
  | 'settings'
  | 'malware'
  | 'ai-agent'
  | 'compliance'
  | 'audit-log';

interface DashboardSidebarProps {
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ currentView, onSelectView }) => {
  const { user } = useAuth();

  const navGroups = [
    {
      group: 'Overview & Telemetry',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'security-overview', label: 'Security Overview', icon: ShieldCheck },
        { id: 'live-traffic', label: 'Live Traffic', icon: Radio, badge: 'Live' },
        { id: 'security-events', label: 'Security Events', icon: Activity },
        { id: 'logs', label: 'Centralized Logs', icon: Terminal, badge: 'Realtime' },
      ]
    },
    {
      group: 'Core Protection',
      items: [
        { id: 'waf', label: 'WAF Engine', icon: ShieldAlert },
        { id: 'firewall', label: 'Firewall', icon: Flame },
        { id: 'applications', label: 'Applications', icon: Server },
        { id: 'networks', label: 'Networks', icon: Network },
      ]
    },
    {
      group: 'Threat & AI Operations',
      items: [
        { id: 'threats', label: 'Threats', icon: Bug },
        { id: 'incidents', label: 'Incidents', icon: Workflow, badge: '3 Active' },
        { id: 'threat-intel', label: 'Threat Intelligence', icon: Globe2 },
        { id: 'malware', label: 'Malware Analysis', icon: Search },
        { id: 'ai-agent', label: 'AI Security Agent', icon: Sparkles, accent: true },
      ]
    },
    {
      group: 'Intelligence & Audit',
      items: [
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'reports', label: 'Reports', icon: FileText },
        { id: 'compliance', label: 'Compliance (Zero Trust)', icon: FileCheck2 },
        { id: 'audit-log', label: 'Audit Logs', icon: ScrollText },
      ]
    },
    {
      group: 'System & Governance',
      items: [
        { id: 'users-roles', label: 'Users & RBAC', icon: Users },
        { id: 'integrations', label: 'Integrations & API', icon: Layers },
        { id: 'billing', label: 'Subscription & SLA', icon: CreditCard },
        { id: 'settings', label: 'Settings', icon: Sliders },
      ]
    }
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800/90 bg-[#090e18] flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-950/50">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
            OAT <span className="text-cyan-400">SECURITY</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-tight">
            ENTERPRISE DEFENSE
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <div className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
              {group.group}
            </div>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id as DashboardView)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive 
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  } ${item.accent && !isActive ? 'text-cyan-400/90 hover:text-cyan-300' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : item.accent ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      item.badge === 'Live'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer System Status Banner */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-2.5 rounded-lg border border-slate-800 bg-[#0d1320] text-[11px] text-slate-400">
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-300 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              CORE SENSORS
            </span>
            <span className="text-emerald-400">ACTIVE</span>
          </div>
          <div className="text-[10px] text-slate-400">Zero Trust Ingress Engine</div>
        </div>
      </div>
    </aside>
  );
};
