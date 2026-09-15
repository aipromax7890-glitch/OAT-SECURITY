import React from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  Download, 
  ArrowUpRight,
  Clock,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BillingModule: React.FC = () => {
  const { currentOrg } = useAuth();

  const invoices = [
    { id: 'INV-2026-03', period: 'March 2026', amount: 'IDR 145,000,000', status: 'Paid', date: '2026-04-01' },
    { id: 'INV-2026-02', period: 'February 2026', amount: 'IDR 145,000,000', status: 'Paid', date: '2026-03-01' },
    { id: 'INV-2026-01', period: 'January 2026', amount: 'IDR 145,000,000', status: 'Paid', date: '2026-02-01' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <span>Enterprise SLA, Quota & Subscription</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dedicated enterprise licensing agreement and billing telemetry for {currentOrg.name}.
          </p>
        </div>
      </div>

      {/* Plan Details & SLA Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/30 to-[#0d1424] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">ENTERPRISE PLATINUM</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
              Active Tier
            </span>
          </div>

          <div>
            <div className="text-2xl font-bold text-slate-100">Unlimited Ingress Guard</div>
            <div className="text-xs text-slate-400 mt-1">Multi-Cloud Anycast WAF + Hardware Firewall Tier</div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>99.99% Financial-grade Availability SLA</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dedicated 24/7/365 Human SOC Retainer</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>15-Minute Critical Incident Response Guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlimited DDoS Mitigation Bandwidth</span>
            </div>
          </div>
        </div>

        {/* Quota & Usage */}
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 mb-1">Monthly Traffic & Ingress Consumption</h3>
            <p className="text-xs text-slate-400">Current billing cycle: April 1, 2026 – April 30, 2026.</p>

            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">HTTP Ingress Requests</span>
                  <span className="text-cyan-300 font-bold">142.8M / 500.0M Requests (28.5%)</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '28.5%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">Protected Subnets & Edge VIPs</span>
                  <span className="text-emerald-300 font-bold">8 of 32 Allocated (25%)</span>
                </div>
                <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Next invoice date: May 1, 2026</span>
            <span className="text-slate-200">Contract Ref: B2B-MANDIRI-2024-SEC</span>
          </div>
        </div>
      </div>

      {/* Invoice History */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100">Enterprise Billing Invoices & Receipts</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                <th className="p-3">INVOICE NUMBER</th>
                <th className="p-3">BILLING PERIOD</th>
                <th className="p-3">AMOUNT (EXCL. TAX)</th>
                <th className="p-3">STATUS</th>
                <th className="p-3">ISSUE DATE</th>
                <th className="p-3 text-right">RECEIPT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-850/50 transition">
                  <td className="p-3 font-bold text-cyan-300">{inv.id}</td>
                  <td className="p-3 text-slate-200">{inv.period}</td>
                  <td className="p-3 font-bold text-slate-100">{inv.amount}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{inv.date}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => alert(`Invoice ${inv.id} downloaded.`)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 text-xs inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
