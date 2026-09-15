import React from 'react';
import { 
  FileCheck2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Download,
  Lock,
  Landmark
} from 'lucide-react';

export const ComplianceModule: React.FC = () => {
  const frameworks = [
    {
      name: 'PCI DSS 4.0 (Cardholder Data)',
      complianceScore: '100%',
      status: 'Fully Compliant',
      controls: [
        { id: 'Req 6.4.1', name: 'Public-facing web applications are protected against known attacks', status: 'Passed' },
        { id: 'Req 6.4.2', name: 'Automated technical solution (WAF) actively detects and prevents web-based attacks', status: 'Passed' },
        { id: 'Req 10.2.1', name: 'Audit logs capture all administrative access to cardholder environment', status: 'Passed' },
        { id: 'Req 1.3.1', name: 'Inbound and outbound traffic to cardholder data environment is restricted', status: 'Passed' }
      ]
    },
    {
      name: 'ISO/IEC 27001:2022 (ISMS)',
      complianceScore: '98%',
      status: 'Fully Compliant',
      controls: [
        { id: 'Control A.8.20', name: 'Network security management and separation of services', status: 'Passed' },
        { id: 'Control A.8.21', name: 'Security of network services and perimeter gateways', status: 'Passed' },
        { id: 'Control A.8.22', name: 'Segregation of networks into zones according to sensitivity', status: 'Passed' },
        { id: 'Control A.8.16', name: 'Monitoring activities and anomaly detection in networks and systems', status: 'Passed' }
      ]
    },
    {
      name: 'Zero Trust Architecture (NIST SP 800-207)',
      complianceScore: '94%',
      status: 'Compliant',
      controls: [
        { id: 'ZT-01', name: 'All data sources and computing services are treated as resources', status: 'Passed' },
        { id: 'ZT-02', name: 'All communication is secured regardless of network location', status: 'Passed' },
        { id: 'ZT-03', name: 'Access to individual enterprise resources is granted per-session', status: 'Passed' },
        { id: 'ZT-04', name: 'Access is determined by dynamic policy and client posture', status: 'Passed' }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-cyan-400" />
            <span>Regulatory Compliance & Zero Trust Verification</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated verification against PCI DSS 4.0, ISO/IEC 27001, OJK SEOJK 29/2022, and NIST Zero Trust.
          </p>
        </div>

        <button
          onClick={() => alert('Compliance Attestation Certificate downloaded.')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 text-xs font-semibold transition"
        >
          <Download className="w-3.5 h-3.5" />
          Export Attestation Certificate
        </button>
      </div>

      {/* Frameworks List */}
      <div className="space-y-6">
        {frameworks.map((fw, idx) => (
          <div key={idx} className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-850 text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-100">{fw.name}</h2>
                  <span className="text-xs text-slate-400">Continuous technical control audit</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono text-emerald-400">{fw.complianceScore}</span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
                  {fw.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fw.controls.map((ctrl, cIdx) => (
                <div key={cIdx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-cyan-400 font-mono text-xs font-bold block">{ctrl.id}</span>
                    <span className="text-xs text-slate-300">{ctrl.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{ctrl.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
