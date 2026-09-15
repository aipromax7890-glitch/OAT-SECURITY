import React, { useState } from 'react';
import { Search, Shield, Flame, Server, Bug, ArrowRight } from 'lucide-react';
import { DashboardView } from '../layout/DashboardSidebar';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: DashboardView) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const quickLinks = [
    { title: 'WAF Rule: OWASP SQL Injection Detection', category: 'WAF Rule', view: 'waf' as DashboardView, icon: Shield },
    { title: 'Core Banking API Gateway (172.67.182.90)', category: 'Protected App', view: 'applications' as DashboardView, icon: Server },
    { title: 'Firewall Policy: Ingress Edge Proxy Rule 10', category: 'Firewall Rule', view: 'firewall' as DashboardView, icon: Flame },
    { title: 'Threat: SQL Injection Exploitation [THR-8891]', category: 'Active Threat', view: 'threats' as DashboardView, icon: Bug },
    { title: 'Incident INC-2026-041: Credential Stuffing', category: 'Incident', view: 'incidents' as DashboardView, icon: Bug },
    { title: 'Compliance: ISO 27001 & PCI DSS 4.0 Audit', category: 'Compliance', view: 'compliance' as DashboardView, icon: Shield },
  ];

  const term = (query || '').trim().toLowerCase();
  const filtered = term 
    ? quickLinks.filter(item => item.title.toLowerCase().includes(term) || item.category.toLowerCase().includes(term))
    : quickLinks;

  return (
    <div className="fixed inset-0 z-50 bg-[#080d17]/80 backdrop-blur-sm flex items-start justify-center pt-24 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0e1628] shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search threats, IP addresses, WAF rules, or applications..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded border border-slate-700">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-3 py-1.5">
            Quick Navigation & Security Assets
          </div>
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching assets or rules found for "{query}".
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onNavigate(item.view);
                    onClose();
                  }}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-800/80 flex items-center justify-between group transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded bg-slate-800 group-hover:bg-cyan-950 text-slate-400 group-hover:text-cyan-400 transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-200 group-hover:text-cyan-300">{item.title}</div>
                      <div className="text-[10px] text-slate-400">{item.category}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition" />
                </button>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-900/60 text-right text-[11px] text-slate-400">
          Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded">ESC</kbd> to exit search
        </div>
      </div>
    </div>
  );
};
