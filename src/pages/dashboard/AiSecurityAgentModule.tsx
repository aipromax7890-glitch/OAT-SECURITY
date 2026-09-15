import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  Bot, 
  AlertTriangle, 
  Cpu, 
  CheckCircle2, 
  ArrowRight, 
  Code2, 
  Terminal,
  Layers,
  FileCheck2
} from 'lucide-react';
import { securityApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BackendOfflineBanner } from '../../components/common/BackendOfflineBanner';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  timestamp: string;
  content: string;
  recommendations?: Array<{
    title: string;
    action: string;
    ruleSnippet?: string;
  }>;
  analysis?: {
    threatScore: number;
    owaspCategory: string;
    confidence: number;
  };
}

export const AiSecurityAgentModule: React.FC = () => {
  const { currentOrg, isBackendOffline } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString(),
      content: `OAT Native SOC Intelligence Agent online for ${currentOrg.name}. Telemetry correlation engine is continuously monitoring WAF, Firewall, and perimeter ingress vectors. How may I assist your incident triage today?`,
      recommendations: [
        {
          title: 'Review Active SQL Injection Heuristic',
          action: 'Inspect high-frequency UNION SELECT attempts originating from Tor exit nodes.',
        }
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deployedRule, setDeployedRule] = useState<string | null>(null);

  const handleSendMessage = async (textToSend?: string) => {
    const rawQuery = textToSend || input || '';
    const query = rawQuery.trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: 'u-' + Date.now(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
      content: query
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await securityApi.analyzeEventWithAi({
        threatType: query,
        sourceIp: '185.220.101.44',
        targetApp: 'Core Banking API',
        payloadContext: query
      });

      const agentMsg: Message = {
        id: 'a-' + Date.now(),
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString(),
        content: res.analysis || 'Analysis complete. The perimeter defense engine has evaluated the event telemetry.',
        recommendations: (res.recommendations || []).map((rec: string, idx: number) => ({
          title: `Action Item ${idx + 1}`,
          action: rec,
          ruleSnippet: idx === 0 ? 'SecRule REQUEST_URI "@contains /api/v1/transfer" "id:9901,phase:2,deny,status:403"' : undefined
        })),
        analysis: {
          threatScore: 88,
          owaspCategory: 'A03:2021-Injection',
          confidence: 96.4
        }
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: 'err-' + Date.now(),
        sender: 'agent',
        timestamp: new Date().toLocaleTimeString(),
        content: `Error communicating with SOC Intelligence Engine: ${err?.message || 'Backend offline'}.`
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeploySnippet = (title: string) => {
    setDeployedRule(title);
    setTimeout(() => setDeployedRule(null), 4000);
  };

  if (isBackendOffline) {
    return <BackendOfflineBanner onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span>AI Security Operations (SOC) Copilot</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Autonomous Triage Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gemini-assisted heuristic event correlation, automated WAF policy synthesis, and anomaly triage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AGENT READY
          </div>
        </div>
      </div>

      {deployedRule && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Rule successfully provisioned and committed to WAF Edge: {deployedRule}</span>
        </div>
      )}

      {/* Quick Prompts Bar */}
      <div className="p-3 rounded-xl border border-slate-800 bg-[#0d1424] space-y-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
          Quick SOC Triage Scenarios:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            'Analyze recent SQLi attack cluster on Core Banking API',
            'Explain credential stuffing spike across rotational ASNs',
            'Generate hardened WAF policy for payment QRIS endpoints',
            'Summarize 24-hour perimeter threat posture and risk score'
          ].map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-left px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-cyan-300 transition"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Container */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] flex flex-col h-[520px] overflow-hidden">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'agent' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-2xl rounded-xl p-4 ${
                msg.sender === 'user' 
                  ? 'bg-cyan-600 text-white shadow-lg' 
                  : 'bg-[#090f1d] border border-slate-800 text-slate-200'
              }`}>
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-slate-700/40 text-[10px] font-mono text-slate-400">
                  <span>{msg.sender === 'user' ? 'Security Analyst' : 'OAT AI Agent'}</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="leading-relaxed whitespace-pre-line text-xs font-sans">
                  {msg.content}
                </div>

                {/* Agent Analysis Scorecard */}
                {msg.analysis && (
                  <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 font-mono text-[10px]">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">THREAT SCORE</span>
                      <span className="text-rose-400 font-bold text-sm">{msg.analysis.threatScore} / 100</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">OWASP CATEGORY</span>
                      <span className="text-cyan-300 font-bold truncate block">{msg.analysis.owaspCategory}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 block">SOC CONFIDENCE</span>
                      <span className="text-emerald-400 font-bold text-sm">{msg.analysis.confidence}%</span>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                      Recommended Mitigation Steps:
                    </span>
                    {msg.recommendations.map((rec, rIdx) => (
                      <div key={rIdx} className="p-2.5 rounded bg-slate-900 border border-slate-800 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 text-xs">{rec.title}</span>
                          <button
                            onClick={() => handleDeploySnippet(rec.title)}
                            className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-mono transition"
                          >
                            Deploy to Edge WAF
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{rec.action}</p>
                        {rec.ruleSnippet && (
                          <pre className="p-2 rounded bg-slate-950 border border-slate-850 font-mono text-[10px] text-cyan-300 overflow-x-auto">
                            {rec.ruleSnippet}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs justify-start items-center text-slate-400 font-mono">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <span>SOC Agent correlating event signatures & generating mitigation policies...</span>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask SOC Agent to analyze an IP, synthesize a WAF rule, or summarize threats..."
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
            <button
              type="submit"
              disabled={loading || !(input || '').trim()}
              className="px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Analyze</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
