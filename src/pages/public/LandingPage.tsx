import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Flame, 
  Radio, 
  Zap, 
  Server, 
  Network, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  AlertTriangle, 
  Terminal, 
  ChevronRight, 
  Globe2, 
  Activity, 
  Eye, 
  FileCheck, 
  Building2, 
  Landmark, 
  ShoppingCart, 
  Hospital, 
  GraduationCap, 
  HardDrive,
  Users,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onEnterDashboard: () => void;
  onOpenAuth: (view: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterDashboard, onOpenAuth }) => {
  const [activeTab, setActiveTab] = useState<'waf' | 'firewall' | 'threats' | 'managed'>('waf');

  const threatsList = [
    { title: 'SQL Injection (SQLi)', category: 'OWASP Top 10', desc: 'Prevents database tampering, bypasses, and unauthorized data leakage in HTTP query/body parameters.' },
    { title: 'Cross-Site Scripting (XSS)', category: 'Client Defense', desc: 'Neutralizes malicious DOM injection, cookie theft payloads, and rogue client script execution.' },
    { title: 'Cross-Site Request Forgery (CSRF)', category: 'Session Security', desc: 'Validates origin headers and cryptographic anti-forgery tokens on transactional endpoints.' },
    { title: 'Path & Directory Traversal', category: 'File Integrity', desc: 'Thwarts unauthorized escape attempts targeting root system directories and credentials.' },
    { title: 'Command & OS Injection', category: 'Runtime Defense', desc: 'Stops shell metacharacters and arbitrary remote execution strings on application servers.' },
    { title: 'Distributed Brute Force', category: 'Authentication', desc: 'Mitigates volumetric password guessing through rate limiting and progressive delays.' },
    { title: 'Credential Abuse & Stuffing', category: 'Identity Guard', desc: 'Recognizes compromised credential batches and anomalous login clusters across rotational ASNs.' },
    { title: 'Malicious & Automated Bots', category: 'Bot Management', desc: 'Distinguishes benign search spiders from malicious scrapers using headless browser fingerprinters.' },
    { title: 'Port Scanning & Recon', category: 'Network Perimeter', desc: 'Detects synchronous SYN scans and sweeps before attackers find vulnerable exposed interfaces.' },
    { title: 'Suspicious Network Traffic', category: 'IDS / IPS', desc: 'Monitors anomalous protocol anomalies, out-of-spec packet sizes, and exfiltration attempts.' },
    { title: 'Layer 3 & 4 DDoS Floods', category: 'Anycast Scrubbing', desc: 'Absorbs volumetric UDP, SYN, and ICMP floods at the edge with multi-Tbps global scrubbing.' },
    { title: 'Layer 7 Application DoS', category: 'HTTP Rate Shaper', desc: 'Protects backend compute by throttling aggressive URI request floods and slowloris connections.' },
    { title: 'Anomalous Request Patterns', category: 'Zero Trust Baseline', desc: 'Machine learning deviation models flags sudden request volume or payload schema violations.' },
    { title: 'Malware & C2 Callback Probes', category: 'Threat Intel', desc: 'Blocks outbound and ingress connections to known command-and-control IP infrastructures.' }
  ];

  const industries = [
    { name: 'Banking', icon: Landmark, desc: 'Strict regulatory compliance, fraud mitigation, and high-throughput core banking transaction protection.' },
    { name: 'Financial Services & FinTech', icon: Landmark, desc: 'Zero-latency WAF inspection for QRIS, payment gateways, and Open Banking APIs.' },
    { name: 'E-Commerce', icon: ShoppingCart, desc: 'Flash-sale bot prevention, credential stuffing mitigation, and continuous checkout availability.' },
    { name: 'Technology & SaaS', icon: Server, desc: 'Multi-tenant API shielding, microservice ingress firewall, and cloud infrastructure monitoring.' },
    { name: 'Healthcare', icon: Hospital, desc: 'Protecting patient electronic health records (EHR) against ransomware and unauthorized exfiltration.' },
    { name: 'Government', icon: Building2, desc: 'Securing national critical digital infrastructure, citizen portals, and sovereign databases.' },
    { name: 'Education', icon: GraduationCap, desc: 'Safeguarding university portals, research repositories, and campus network perimeters.' },
    { name: 'Enterprise Conglomerates', icon: Building2, desc: 'Unified security operations across diverse multi-cloud environments and global branches.' }
  ];

  const services = [
    { title: 'Managed WAF', desc: '24/7 rule optimization, OWASP tuning, and custom regex policies managed by certified OAT SecOps engineers.' },
    { title: 'Managed Firewall', desc: 'Continuous network ACL updates, perimeter auditing, and perimeter rule hardening for zero-trust environments.' },
    { title: 'Security Monitoring (SOC as a Service)', desc: 'Round-the-clock telemetry correlation, anomaly hunting, and rapid incident escalation for your assets.' },
    { title: 'Vulnerability Assessment', desc: 'Automated and expert-led vulnerability discovery across web applications, APIs, and network gateways.' },
    { title: 'Penetration Testing', desc: 'Authorized red-team simulated attacks to stress-test your defenses and validate defensive posture.' },
    { title: 'Incident Response & Containment', desc: 'Emergency response retainer with guaranteed SLA to contain active breaches, isolate threats, and recover.' },
    { title: 'Security Hardening', desc: 'Systematic configuration of web servers, cloud infrastructure, TLS suites, and operating system policies.' },
    { title: 'Security Consultation & Governance', desc: 'Executive guidance on ISO 27001, PCI DSS 4.0, NIST CSF compliance and Zero Trust architecture.' }
  ];

  return (
    <div className="min-h-screen bg-[#080d17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Public Header */}
      <nav className="h-20 border-b border-slate-800/80 bg-[#090f1b]/95 backdrop-blur sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-wider text-slate-100">OAT</span>
            <span className="text-lg font-bold tracking-wider text-cyan-400 ml-1.5">SECURITY</span>
            <span className="hidden sm:inline-block ml-3 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-950 border border-cyan-800 text-cyan-300">
              Enterprise SOC
            </span>
          </div>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#protection" className="hover:text-cyan-400 transition">Protection</a>
          <a href="#architecture" className="hover:text-cyan-400 transition">How It Works</a>
          <a href="#threats" className="hover:text-cyan-400 transition">Threat Matrix</a>
          <a href="#industries" className="hover:text-cyan-400 transition">Industries</a>
          <a href="#services" className="hover:text-cyan-400 transition">Managed Services</a>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth('login')}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition"
          >
            Masuk Portal
          </button>
          <button
            onClick={onEnterDashboard}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-950/50 transition flex items-center gap-1.5"
          >
            <span>Buka Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 lg:px-12 max-w-7xl mx-auto w-full text-center relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono mb-6">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          ZERO TRUST • DEFENSE IN DEPTH • CONTINUOUS PROTECTION
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Protect Your Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">Infrastructure.</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
          Enterprise-grade WAF, firewall, threat detection, and security monitoring untuk melindungi website, aplikasi, dan jaringan bisnis Anda.
        </p>

        {/* Action CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onEnterDashboard}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-xl shadow-cyan-950/60 transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Mulai Melindungi Infrastruktur
          </button>
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700 transition flex items-center justify-center gap-2"
          >
            Jadwalkan Konsultasi
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Enterprise Metrics Ribbon */}
        <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border border-slate-800 bg-[#0b1220]/80 text-left">
          <div>
            <div className="text-2xl font-bold font-mono text-cyan-400">99.99%</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">SLA Uptime & Availability</div>
            <div className="text-[11px] text-slate-400">Global Anycast edge nodes</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-slate-100">&lt; 1.5 ms</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Inspection Latency</div>
            <div className="text-[11px] text-slate-400">Zero-impact wire speed</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-400">14.2M+</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Daily Attack Mitigation</div>
            <div className="text-[11px] text-slate-400">OWASP, DDoS, Bot vectors</div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-sky-400">24/7/365</div>
            <div className="text-xs font-semibold text-slate-300 mt-1">Dedicated SOC Retainer</div>
            <div className="text-[11px] text-slate-400">Human triage + AI Copilot</div>
          </div>
        </div>

        {/* Security Dashboard Preview Section */}
        <div className="mt-16 text-left">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                Live Enterprise Telemetry Console Preview
              </span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Marketing Preview Data
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#0a101d] overflow-hidden shadow-2xl">
            {/* Mock Header */}
            <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                <span className="ml-2 text-slate-300">oat-security.cluster-ingress.internal</span>
              </div>
              <div className="text-[11px] text-cyan-400">STATUS: ZERO THREAT ACTIVE BYPASS</div>
            </div>

            {/* Mock Dashboard Grid */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#0e1628] border border-slate-800">
                  <div className="text-xs text-slate-400 font-mono">REQUESTS (24H)</div>
                  <div className="text-2xl font-bold font-mono text-slate-100 mt-1">4,892,410</div>
                  <div className="text-[11px] text-emerald-400 mt-1">97.08% Clean Traffic</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0e1628] border border-slate-800">
                  <div className="text-xs text-slate-400 font-mono">BLOCKED ATTACKS</div>
                  <div className="text-2xl font-bold font-mono text-rose-400 mt-1">142,850</div>
                  <div className="text-[11px] text-rose-400/80 mt-1">100% Ingress Drops</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0e1628] border border-slate-800">
                  <div className="text-xs text-slate-400 font-mono">ACTIVE THREATS</div>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">18 Investigated</div>
                  <div className="text-[11px] text-slate-400 mt-1">3 Critical Escalated</div>
                </div>
                <div className="p-4 rounded-xl bg-[#0e1628] border border-slate-800">
                  <div className="text-xs text-slate-400 font-mono">DEFENSE RISK SCORE</div>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">94 / 100</div>
                  <div className="text-[11px] text-cyan-400 mt-1">Grade A+ Enterprise</div>
                </div>
              </div>

              {/* Sample Event Table in Preview */}
              <div className="rounded-xl border border-slate-800/80 bg-[#0d1424] overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="p-3">TIMESTAMP</th>
                      <th className="p-3">SOURCE IP</th>
                      <th className="p-3">APPLICATION</th>
                      <th className="p-3">DETECTED THREAT</th>
                      <th className="p-3">SEVERITY</th>
                      <th className="p-3">POLICY ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300">
                    <tr>
                      <td className="p-3 text-slate-400">12:08:41</td>
                      <td className="p-3 text-cyan-300 font-semibold">185.220.101.44 (DE)</td>
                      <td className="p-3">Core Banking API</td>
                      <td className="p-3 text-rose-300">SQL Injection [UNION SELECT]</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span></td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-bold">BLOCKED (403)</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-400">12:06:12</td>
                      <td className="p-3 text-cyan-300 font-semibold">45.133.1.82 (RU)</td>
                      <td className="p-3">Payment Clearing</td>
                      <td className="p-3 text-amber-300">Distributed Credential Stuffing</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">HIGH</span></td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 font-bold">CHALLENGED</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-slate-400">11:58:19</td>
                      <td className="p-3 text-cyan-300 font-semibold">194.26.29.112 (NL)</td>
                      <td className="p-3">Gov Identity Gateway</td>
                      <td className="p-3 text-rose-300">Path Traversal (../../etc/shadow)</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span></td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-bold">BLOCKED</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Architecture Pipeline (Section 3) */}
      <section id="architecture" className="py-20 px-6 lg:px-12 bg-[#090f1d] border-t border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Real-time Inspection Flow</span>
            <h2 className="text-3xl font-bold text-slate-100 mt-2">How It Works: Zero Trust Inspection Pipeline</h2>
            <p className="text-sm text-slate-400 mt-3">
              Setiap request diverifikasi secara berkelanjutan sebelum mencapai sistem internal organisasi Anda.
            </p>
          </div>

          {/* Step Pipeline Flow */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {[
              { step: '01', title: 'Internet Traffic', desc: 'Ingress users, APIs, and client requests from public internet.', icon: Globe2 },
              { step: '02', title: 'Security Gateway', desc: 'Anycast scrubbing, TLS termination & DDoS mitigation.', icon: ShieldCheck },
              { step: '03', title: 'WAF / Firewall', desc: 'Deep packet inspection against OWASP & network ACLs.', icon: Flame },
              { step: '04', title: 'Threat Detection', desc: 'Behavioral anomalies, bot analysis & signature heuristics.', icon: Activity },
              { step: '05', title: 'Policy Engine', desc: 'Zero Trust authorization: Allow, Challenge, or Block.', icon: Cpu },
              { step: '06', title: 'Application & Network', desc: 'Clean, verified traffic forwarded to backend infrastructure.', icon: Server }
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="p-4 rounded-xl border border-slate-800 bg-[#0e1628] relative flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                        {s.step}
                      </span>
                      <Icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-sm font-semibold text-slate-200 mb-1">{s.title}</div>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                  {i < 5 && (
                    <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-cyan-500/50 z-10">
                      →
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Protection Modules (Section 3) */}
      <section id="protection" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Defense In Depth</span>
          <h2 className="text-3xl font-bold text-slate-100 mt-2">Comprehensive Enterprise Protection</h2>
          <p className="text-sm text-slate-400 mt-3">
            Layanan perlindungan berlapis yang dirancang untuk kebutuhan kepatuhan perbankan dan enterprise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: 'Web Application Firewall', icon: Shield, desc: 'Protects APIs and websites against OWASP Top 10, zero-days, and custom HTTP exploit vectors with real-time rule enforcement.' },
            { title: 'Network Firewall', icon: Flame, desc: 'Stateful Layer 3/4 perimeter control, IP range whitelisting, CIDR zoning, and port-level access policies.' },
            { title: 'DDoS Protection', icon: Zap, desc: 'Multi-terabit Anycast mitigation against volumetric SYN, UDP, and application-layer HTTP floods with zero downtime.' },
            { title: 'Bot Protection', icon: Eye, desc: 'Behavioral fingerprinting to stop scraping, inventory hoarding, credential stuffing, and headless automation.' },
            { title: 'API Security', icon: Layers, desc: 'Schema validation, token bucket rate limiting, JWT authentication enforcement, and sensitive data leakage inspection.' },
            { title: 'Intrusion Detection (IDS)', icon: Activity, desc: 'Heuristic anomaly detection across network interfaces to identify lateral movement and unauthorized scanning.' },
            { title: 'Threat Intelligence', icon: Globe2, desc: 'Real-time IOC synchronization with global threat feeds, CERT databases, and financial industry security groups.' },
            { title: 'Continuous Monitoring', icon: Radio, desc: 'Sub-second telemetry processing, centralized SIEM logs, and automated incident correlation for 24/7 ops.' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-6 rounded-xl border border-slate-800 bg-[#0d1424] hover:border-slate-700 transition">
                <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Threat Protection Matrix (Section 3) */}
      <section id="threats" className="py-20 px-6 lg:px-12 bg-[#090f1d] border-t border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Threat Taxonomy</span>
            <h2 className="text-3xl font-bold text-slate-100 mt-2">Threats Detected & Mitigated</h2>
            <p className="text-sm text-slate-400 mt-3">
              Kategori ancaman siber yang ditangani secara proaktif tanpa interupsi operasional bisnis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {threatsList.map((t, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-[#0e1628] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-200">{t.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{t.desc}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Continuous Mitigation Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section (Section 3) */}
      <section id="industries" className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Target Sectors</span>
          <h2 className="text-3xl font-bold text-slate-100 mt-2">Built for Regulated Industries</h2>
          <p className="text-sm text-slate-400 mt-3">
            Dipercaya oleh institusi finansial, enterprise perbankan, instansi pemerintah, dan startup skala besar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {industries.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <div key={i} className="p-6 rounded-xl border border-slate-800 bg-[#0d1424] text-left">
                <div className="p-3 rounded-lg bg-slate-800/80 text-cyan-400 border border-slate-700 w-fit mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-base font-semibold text-slate-100 mb-1">{ind.name}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{ind.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Managed Services Section (Section 3) */}
      <section id="services" className="py-20 px-6 lg:px-12 bg-[#090f1d] border-t border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Managed Security Services (MSSP)</span>
            <h2 className="text-3xl font-bold text-slate-100 mt-2">Layanan Keamanan Dikelola Penuh</h2>
            <p className="text-sm text-slate-400 mt-3">
              Solusi ideal untuk perusahaan yang membutuhkan tim security profesional tanpa harus membangun SOC in-house dari awal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((srv, idx) => (
              <div key={idx} className="p-5 rounded-xl border border-slate-800 bg-[#0e1628] hover:border-cyan-500/30 transition">
                <div className="text-xs font-mono text-cyan-400 font-semibold mb-1">SERVICE 0{idx + 1}</div>
                <div className="text-sm font-semibold text-slate-200 mb-2">{srv.title}</div>
                <p className="text-xs text-slate-400 leading-relaxed">{srv.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 p-8 rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div>
              <h3 className="text-xl font-bold text-slate-100">Siap Melindungi Infrastruktur Digital Anda?</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Dapatkan assessment keamanan awal dan uji ketahanan WAF kami bersama tim konsultan cybersecurity enterprise OAT SECURITY.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-lg whitespace-nowrap"
              >
                Jadwalkan Konsultasi Teknis
              </button>
              <button
                onClick={onEnterDashboard}
                className="px-6 py-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition whitespace-nowrap"
              >
                Buka Live Dashboard
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Footer (Section 3) */}
      <footer className="pt-16 pb-12 px-6 lg:px-12 bg-[#060a12] border-t border-slate-800/80 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 mb-12 text-left">
          <div>
            <div className="font-semibold text-slate-200 mb-3">Product</div>
            <ul className="space-y-2">
              <li><a href="#protection" className="hover:text-cyan-400">Cloud WAF</a></li>
              <li><a href="#protection" className="hover:text-cyan-400">Next-Gen Firewall</a></li>
              <li><a href="#protection" className="hover:text-cyan-400">DDoS Protection</a></li>
              <li><a href="#protection" className="hover:text-cyan-400">API Gateway Guard</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-200 mb-3">Solutions</div>
            <ul className="space-y-2">
              <li><a href="#industries" className="hover:text-cyan-400">Banking Security</a></li>
              <li><a href="#industries" className="hover:text-cyan-400">FinTech & Payments</a></li>
              <li><a href="#industries" className="hover:text-cyan-400">E-Commerce Protection</a></li>
              <li><a href="#industries" className="hover:text-cyan-400">Government Sovereign</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-200 mb-3">Services</div>
            <ul className="space-y-2">
              <li><a href="#services" className="hover:text-cyan-400">Managed SOC 24/7</a></li>
              <li><a href="#services" className="hover:text-cyan-400">Penetration Testing</a></li>
              <li><a href="#services" className="hover:text-cyan-400">Incident Response</a></li>
              <li><a href="#services" className="hover:text-cyan-400">Hardening Advisory</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-200 mb-3">Company</div>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-cyan-400">About OAT SECURITY</a></li>
              <li><a href="#" className="hover:text-cyan-400">Security Research</a></li>
              <li><a href="#" className="hover:text-cyan-400">Certifications</a></li>
              <li><a href="#" className="hover:text-cyan-400">Careers</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-200 mb-3">Resources</div>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-cyan-400">Documentation</a></li>
              <li><a href="#" className="hover:text-cyan-400">Threat Advisory</a></li>
              <li><a href="#" className="hover:text-cyan-400">API Reference</a></li>
              <li><a href="#" className="hover:text-cyan-400">Status Page</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-slate-200 mb-3">Legal & Trust</div>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-cyan-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-cyan-400">Terms of Service</a></li>
              <li><a href="#" className="hover:text-cyan-400">Security Policy</a></li>
              <li><a href="#" className="hover:text-cyan-400">Responsible Disclosure</a></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-200">OAT SECURITY ENTERPRISE</span>
            <span className="text-slate-500">© 2026 OAT Security Technologies. All rights reserved.</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Security controls aligned with ISO 27001, PCI DSS 4.0, NIST CSF, and OWASP standards.
          </div>
        </div>
      </footer>
    </div>
  );
};
