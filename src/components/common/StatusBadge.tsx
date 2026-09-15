import React from 'react';
import { ThreatSeverity, ThreatAction } from '../../types';

interface StatusBadgeProps {
  type?: 'severity' | 'action' | 'health' | 'status';
  value?: string | null;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type = 'severity', value, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const val = (value != null ? String(value) : '').trim();

  if (!val) {
    return (
      <span className={`inline-flex items-center rounded border border-slate-800 bg-slate-900/60 text-slate-500 font-mono ${sizeClasses}`}>
        —
      </span>
    );
  }

  // Severity
  if (type === 'severity' || ['Critical', 'High', 'Medium', 'Low', 'Info', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].includes(val)) {
    const norm = val.toUpperCase();
    if (norm === 'CRITICAL') {
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Critical
        </span>
      );
    }
    if (norm === 'HIGH') {
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded border border-orange-500/30 bg-orange-500/10 text-orange-400 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          High
        </span>
      );
    }
    if (norm === 'MEDIUM') {
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded border border-amber-500/30 bg-amber-500/10 text-amber-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Medium
        </span>
      );
    }
    if (norm === 'LOW' || norm === 'INFO') {
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded border border-blue-500/30 bg-blue-500/10 text-blue-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          Low
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded border border-slate-700 bg-slate-800 text-slate-300 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        {val}
      </span>
    );
  }

  // Action
  if (type === 'action' || ['Allowed', 'Blocked', 'Challenged', 'Logged', 'ALLOW', 'DENY', 'LOG', 'BLOCK', 'DROP', 'RATE_LIMIT'].includes(val.toUpperCase())) {
    const norm = val.toUpperCase();
    if (norm === 'BLOCKED' || norm === 'DENY' || norm === 'BLOCK' || norm === 'DROP') {
      return (
        <span className={`inline-flex items-center font-mono font-semibold rounded border border-rose-500/30 bg-rose-950/40 text-rose-300 ${sizeClasses}`}>
          BLOCKED
        </span>
      );
    }
    if (norm === 'ALLOWED' || norm === 'ALLOW') {
      return (
        <span className={`inline-flex items-center font-mono font-semibold rounded border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 ${sizeClasses}`}>
          ALLOWED
        </span>
      );
    }
    if (norm === 'CHALLENGED' || norm === 'CHALLENGE') {
      return (
        <span className={`inline-flex items-center font-mono font-semibold rounded border border-amber-500/30 bg-amber-950/40 text-amber-300 ${sizeClasses}`}>
          CHALLENGED
        </span>
      );
    }
    if (norm === 'RATE_LIMIT') {
      return (
        <span className={`inline-flex items-center font-mono font-semibold rounded border border-orange-500/30 bg-orange-950/40 text-orange-300 ${sizeClasses}`}>
          RATE LIMITED
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center font-mono font-medium rounded border border-slate-700 bg-slate-800/80 text-slate-300 ${sizeClasses}`}>
        LOGGED
      </span>
    );
  }

  // Status & Health
  const lower = val.toLowerCase();
  if (lower === 'operational' || lower === 'online' || lower === 'protected' || lower === 'active' || lower === 'mitigated' || lower === 'resolved' || lower === 'pass') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        {val}
      </span>
    );
  }
  if (lower === 'degraded' || lower === 'warning' || lower === 'monitoring' || lower === 'investigating' || lower === 'detected' || lower === 'under review') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-300 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        {val}
      </span>
    );
  }
  if (lower === 'offline' || lower === 'critical' || lower === 'fail' || lower === 'closed') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        {val}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center rounded border border-slate-700 bg-slate-800 text-slate-300 ${sizeClasses}`}>
      {val}
    </span>
  );
};
