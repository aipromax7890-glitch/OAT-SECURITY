import React, { useState } from 'react';
import { 
  Workflow, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Plus, 
  User, 
  ShieldAlert 
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const IncidentsModule: React.FC = () => {
  const [incidents, setIncidents] = useState([
    {
      id: 'INC-2026-041',
      title: 'Automated Credential Stuffing Wave on Retail Internet Banking',
      severity: 'Critical',
      status: 'In Progress',
      leadAnalyst: 'Ahmad Fauzi',
      created: 'Today at 10:14 WIB',
      slaTimer: '18 mins remaining',
      target: 'Retail Internet Banking Portal',
      description: 'Distributed attacks utilizing 400+ rotational residential proxy IPs attempting credential verification against /api/auth/v2/login. Perimeter bot challenge enforced.'
    },
    {
      id: 'INC-2026-039',
      title: 'Heuristic Detection of SQL Injection Payload in Core Banking API',
      severity: 'High',
      status: 'Mitigated',
      leadAnalyst: 'Ahmad Fauzi',
      created: 'Yesterday at 22:45 WIB',
      slaTimer: 'Resolved in 14m',
      target: 'Core Banking API Gateway',
      description: 'Ingress URI parameter contained UNION SELECT metadata exfiltration attempt. Blocked with 403 Forbidden.'
    },
    {
      id: 'INC-2026-037',
      title: 'Anomalous Port Sweep Probe targeting DMZ Boundary',
      severity: 'Medium',
      status: 'Closed',
      leadAnalyst: 'Dimas Wicaksono',
      created: '2 days ago',
      slaTimer: 'Resolved in 28m',
      target: 'DMZ Edge Ingress Proxy',
      description: 'Probing ports 22, 2375, 8080. Source ASN added to stateful drop filter.'
    }
  ]);

  const [selectedIncident, setSelectedIncident] = useState(incidents[0]);
  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<string[]>([
    'Triage initiated: Enforced Layer 7 managed JS challenge on /api/auth/v2/*',
    'Origin server CPU returned to baseline (<14%). Threat contained.',
    'Escalation sent to Bank Mandiri Fraud Investigation Division.'
  ]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNote = (noteText || '').trim();
    if (!cleanNote) return;
    setNotes(prev => [...prev, cleanNote]);
    setNoteText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Workflow className="w-5 h-5 text-rose-400" />
            <span>Incident Response & SOC Escalations</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured containment workflows, SLA escalation timers, and evidentiary audit records.
          </p>
        </div>

        <button
          onClick={() => alert('Incident declaration flow initiated with emergency SOC paging.')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Declare Security Incident
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident List */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase text-slate-400">Active Incident Queue (3)</div>
          {incidents.map(inc => (
            <div
              key={inc.id}
              onClick={() => setSelectedIncident(inc)}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                selectedIncident.id === inc.id
                  ? 'border-cyan-500/50 bg-[#0e172a] shadow-lg'
                  : 'border-slate-800 bg-[#0d1424] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-cyan-300">{inc.id}</span>
                <StatusBadge type="severity" value={inc.severity} size="sm" />
              </div>
              <h3 className="text-xs font-semibold text-slate-100 mb-2 leading-snug">{inc.title}</h3>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/80">
                <span>{inc.leadAnalyst}</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {inc.slaTimer}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Incident Workspace */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-800 bg-[#0d1424] space-y-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-cyan-300">{selectedIncident.id}</span>
                <StatusBadge type="severity" value={selectedIncident.severity} size="sm" />
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                  {selectedIncident.status}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100">{selectedIncident.title}</h2>
              <div className="text-xs text-slate-400 mt-1">
                Target: <span className="text-slate-200 font-semibold">{selectedIncident.target}</span> • Created: {selectedIncident.created}
              </div>
            </div>

            <button
              onClick={() => alert(`Incident ${selectedIncident.id} status marked as MITIGATED.`)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold whitespace-nowrap shadow-md"
            >
              Mark Mitigated & Close
            </button>
          </div>

          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Incident Context & Forensic Assessment:
            </span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-3 rounded-lg border border-slate-800">
              {selectedIncident.description}
            </p>
          </div>

          {/* Timeline & Notes */}
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              SOC Investigation Activity & Timeline:
            </span>
            <div className="space-y-2 mb-4">
              {notes.map((note, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Append official SOC forensic note or triage update..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200"
              >
                Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
