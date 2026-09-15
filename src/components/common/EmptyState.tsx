import React from 'react';
import { ShieldCheck, LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = ShieldCheck,
  title = 'Your environment is currently clear.',
  description = 'No security events or anomalies detected within this filter window. Continuous Zero Trust monitoring active.',
  actionLabel,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-slate-800 bg-[#0e1526]/50">
      <div className="p-3 rounded-xl bg-cyan-950/40 text-cyan-400 border border-cyan-800/30 mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mt-1 mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
