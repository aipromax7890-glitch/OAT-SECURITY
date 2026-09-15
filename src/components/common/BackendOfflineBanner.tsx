import React from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface BackendOfflineBannerProps {
  onRetry?: () => void;
  message?: string;
  isStreamOnly?: boolean;
}

export const BackendOfflineBanner: React.FC<BackendOfflineBannerProps> = ({ 
  onRetry, 
  message,
  isStreamOnly = false
}) => {
  const { isBackendOffline, toggleBackendOffline } = useAuth();

  return (
    <div className="rounded-lg border border-rose-500/40 bg-rose-950/30 p-4 text-slate-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-rose-500/20 text-rose-400">
            {isStreamOnly ? <WifiOff className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 font-semibold text-rose-300 font-mono tracking-wide">
              <span>{isStreamOnly ? 'KONEKSI WAKTU NYATA TERPUTUS' : 'BACKEND OFFLINE'}</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {message || (isStreamOnly 
                ? 'Koneksi telemetri waktu nyata terputus. Mencoba menghubungkan kembali (Reconnecting to security stream)...' 
                : 'Server telemetri keamanan offline / tidak dapat dijangkau. Antarmuka hanya menyajikan data riil tanpa rekayasa.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reconnect Now
            </button>
          )}

          {/* Operator testing toggle */}
          <button
            onClick={toggleBackendOffline}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 transition"
            title="Toggle simulated connection to test online vs offline enterprise handling"
          >
            {isBackendOffline ? 'Switch Online' : 'Simulate Offline'}
          </button>
        </div>
      </div>
    </div>
  );
};
