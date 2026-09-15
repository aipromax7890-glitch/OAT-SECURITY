import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Globe, 
  LogOut, 
  ChevronDown, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  UserCheck,
  Shield,
  ExternalLink,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface DashboardTopNavProps {
  onOpenSearch: () => void;
  onNavigatePublic: () => void;
  realtimeStatus: string;
}

export const DashboardTopNav: React.FC<DashboardTopNavProps> = ({ 
  onOpenSearch, 
  onNavigatePublic,
  realtimeStatus 
}) => {
  const { user, currentOrg, organizations, switchOrg, switchRole, logout, isBackendOffline, toggleBackendOffline } = useAuth();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 'N-1',
      title: 'Critical WAF Block Triggered',
      desc: 'SQL Injection detected on /v2/transfers/inquiry from 185.220.101.44',
      time: '3m ago',
      severity: 'Critical',
      read: false
    },
    {
      id: 'N-2',
      title: 'Firewall Policy Rule Updated',
      desc: 'Port 22 SSH ingress denied on subnet 10.240.10.0/24',
      time: '18m ago',
      severity: 'Medium',
      read: false
    },
    {
      id: 'N-3',
      title: 'New Incident Assigned',
      desc: 'INC-2026-041 credential stuffing assigned to SOC Lead Ahmad Fauzi',
      time: '42m ago',
      severity: 'High',
      read: true
    },
    {
      id: 'N-4',
      title: 'SSL/TLS Cipher Verification',
      desc: 'All 4 enterprise apps aligned with TLS 1.3 requirement',
      time: '2h ago',
      severity: 'Low',
      read: true
    }
  ];

  const rolesList: UserRole[] = [
    'Super Admin',
    'Security Admin',
    'Security Analyst',
    'Organization Admin',
    'Viewer'
  ];

  const isLive = realtimeStatus === 'CONNECTED' && !isBackendOffline;

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0d1322] px-4 md:px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Left: Brand / Org Selector */}
      <div className="flex items-center gap-4">
        {/* Organization Selector */}
        <div className="relative">
          <button
            onClick={() => setShowOrgDropdown(!showOrgDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-left transition"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
            <div>
              <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                {currentOrg.name}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {currentOrg.industry} • Risk Score: {currentOrg.riskScore}/100
              </div>
            </div>
          </button>

          {showOrgDropdown && (
            <div className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-800 bg-[#0e172a] shadow-2xl p-2 z-50">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 py-1.5">
                Switch Organization (Multi-Tenant)
              </div>
              {organizations.map(org => (
                <button
                  key={org.id}
                  onClick={() => {
                    switchOrg(org.id);
                    setShowOrgDropdown(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition ${
                    org.id === currentOrg.id 
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' 
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-[10px] text-slate-400">{org.domain} • {org.tier}</div>
                  </div>
                  {org.id === currentOrg.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Global Live Status Badge */}
        <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            {isLive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE TELEMETRY
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {isBackendOffline ? 'BACKEND OFFLINE' : 'RECONNECTING'}
              </span>
            )}
          </div>

          <button
            onClick={toggleBackendOffline}
            className="text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60 border border-slate-800"
            title="Simulate backend offline state to verify required system resilience"
          >
            {isBackendOffline ? 'Go Online' : 'Test Offline'}
          </button>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search threats, rules, IP...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-slate-800 border border-slate-700 rounded text-slate-300">⌘K</kbd>
        </button>

        {/* Public Website Switcher */}
        <button
          onClick={onNavigatePublic}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
          title="Lihat Website Public OAT SECURITY"
        >
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>Public Portal</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white relative transition"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
              2
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-[#0e172a] shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-200">Security Notifications</div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  2 Critical/High
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 hover:bg-slate-800/40 transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-slate-800 text-center bg-slate-900/50">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  View Central Event Log
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 transition"
          >
            <div className="w-7 h-7 rounded-full bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 text-xs font-bold">
              {user ? user.name.slice(0, 2).toUpperCase() : 'OS'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-200 leading-none">{user?.name || 'Ahmad Fauzi'}</div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">{user?.role || 'Security Analyst'}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-[#0e172a] shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <div className="text-xs font-semibold text-slate-200">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  <Shield className="w-3 h-3" />
                  {user?.role}
                </div>
              </div>

              {/* Persona Testing Selector */}
              <div className="py-1">
                <div className="text-[10px] uppercase font-semibold text-slate-400 px-3 py-1">
                  Test Enterprise RBAC Persona
                </div>
                {rolesList.map(r => (
                  <button
                    key={r}
                    onClick={() => {
                      switchRole(r);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded text-xs flex items-center justify-between transition ${
                      user?.role === r ? 'bg-slate-800 text-cyan-300 font-medium' : 'text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <span>{r}</span>
                    {user?.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800 mt-1">
                <button
                  onClick={() => {
                    logout();
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
