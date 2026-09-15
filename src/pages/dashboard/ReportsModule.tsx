import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle2, 
  FileCheck2, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ReportsModule: React.FC = () => {
  const { currentOrg } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);

  const reports = [
    {
      id: 'REP-2026-M03',
      title: 'Monthly Executive Cybersecurity & Perimeter Defense Posture',
      category: 'Executive Summary',
      period: 'March 2026',
      generated: '2026-04-01',
      size: '2.4 MB PDF',
      summary: 'Comprehensive review of 142K blocked attacks, 99.82% WAF accuracy, and zero unauthorized intrusions across banking ingress.'
    },
    {
      id: 'REP-PCI-40',
      title: 'PCI DSS v4.0 Requirement 6.4.2 Web Application Security Audit',
      category: 'Compliance Audit',
      period: 'Q1 2026',
      generated: '2026-03-31',
      size: '4.8 MB PDF',
      summary: 'Attestation of automated technical solution detecting and preventing web-based attacks on cardholder data environments (CDE).'
    },
    {
      id: 'REP-ISO-27001',
      title: 'ISO/IEC 27001:2022 Annex A Control 8.20 Network Security Verification',
      category: 'Compliance Audit',
      period: 'Q1 2026',
      generated: '2026-03-25',
      size: '3.1 MB PDF',
      summary: 'Network segregation, stateful firewall policies, and continuous SIEM monitoring compliance audit report.'
    },
    {
      id: 'REP-DDOS-MIT',
      title: 'Volumetric Anycast DDoS Scrubbing Efficacy & Latency Benchmark',
      category: 'Technical Telemetry',
      period: 'Past 30 Days',
      generated: '2026-03-20',
      size: '1.9 MB PDF',
      summary: 'Telemetry log confirming zero packet drops and sub-1.5ms edge latency across 14 million daily requests.'
    }
  ];

  const handleDownload = (id: string, title: string) => {
    setDownloading(id);
    setTimeout(() => {
      setDownloading(null);
      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(
        `OAT SECURITY ENTERPRISE AUDIT REPORT\n` +
        `Title: ${title}\n` +
        `Organization: ${currentOrg.name}\n` +
        `Generated: ${new Date().toISOString()}\n` +
        `Cryptographic Hash: SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\n` +
        `Compliance: PCI DSS 4.0 / ISO 27001 / SOC 2 Type II Verified`
      );
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${id}_Report.txt`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Executive & Compliance Security Reports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit-ready documentation for Board of Directors, regulators (OJK/BI), and external auditors.
          </p>
        </div>

        <button
          onClick={() => alert('Custom security report generated and sent to corporate email.')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg transition"
        >
          <Calendar className="w-3.5 h-3.5" />
          Generate Custom Audit Report
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map(rep => (
          <div key={rep.id} className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {rep.category}
                </span>
                <span className="text-xs font-mono text-slate-400">{rep.period}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mb-2 leading-snug">{rep.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{rep.summary}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">{rep.size}</span>
              <button
                onClick={() => handleDownload(rep.id, rep.title)}
                disabled={downloading === rep.id}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading === rep.id ? 'Generating PDF...' : 'Download Report'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
