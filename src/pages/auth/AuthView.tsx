import React, { useState } from 'react';
import { Shield, Lock, Mail, Key, Building, CheckCircle2, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset' | 'verify';

interface AuthViewProps {
  initialMode?: AuthMode;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'login', onSuccess, onCancel }) => {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  // Form States
  const [email, setEmail] = useState('ahmad.fauzi@bankmandiri.co.id');
  const [password, setPassword] = useState('••••••••••••');
  const [company, setCompany] = useState('PT Bank Mandiri (Persero) Tbk');
  const [role, setRole] = useState<UserRole>('Security Analyst');
  const [verifyCode, setVerifyCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'login') {
        await login(email, role);
        onSuccess();
      } else if (mode === 'register') {
        setMessage({ type: 'success', text: 'Verification code sent to enterprise corporate email.' });
        setMode('verify');
      } else if (mode === 'verify') {
        await login(email, role);
        onSuccess();
      } else if (mode === 'forgot') {
        setMessage({ type: 'success', text: 'Password reset link sent to your registered security email.' });
        setMode('reset');
      } else if (mode === 'reset') {
        setMessage({ type: 'success', text: 'Credentials updated. You may now authenticate.' });
        setMode('login');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Authentication error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#080c16]/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1628] shadow-2xl overflow-hidden p-6 sm:p-8 relative">
        {/* Close / Back */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-xs px-2 py-1 rounded bg-slate-800/60"
        >
          ✕ Close
        </button>

        {/* Brand header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold text-slate-100">
              OAT <span className="text-cyan-400">SECURITY</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400">Enterprise Access Portal</div>
          </div>
        </div>

        {/* Tabs / Subtitle */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-100">
            {mode === 'login' && 'Sign in to Security Console'}
            {mode === 'register' && 'Request Enterprise Access'}
            {mode === 'forgot' && 'Reset Security Credentials'}
            {mode === 'reset' && 'Create New Password'}
            {mode === 'verify' && 'Verify Corporate Email'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' && 'Enter your organizational credentials to manage WAF and Firewall.'}
            {mode === 'register' && 'Account provisioned with Zero Trust authorization verification.'}
            {mode === 'forgot' && 'Provide your authorized company email for password reset token.'}
            {mode === 'reset' && 'Set a strong password meeting enterprise compliance criteria.'}
            {mode === 'verify' && 'Enter the 6-digit cryptographic confirmation token.'}
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-xs mb-4 flex items-center gap-2 ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Email */}
          {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="analyst@bankmandiri.co.id"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* Company & Role for Register */}
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Enterprise Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    placeholder="PT Bank Mandiri (Persero) Tbk"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Role Selector (Enterprise RBAC Simulation & Selection) */}
          {(mode === 'login' || mode === 'register') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target RBAC Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Security Analyst">Security Analyst (Triage, Telemetry, Incidents)</option>
                <option value="Security Admin">Security Admin (WAF Rules, Firewall, Policies)</option>
                <option value="Super Admin">Super Admin (Full Platform Control)</option>
                <option value="Organization Admin">Organization Admin (Org, Users, Reports)</option>
                <option value="Viewer">Viewer (Read-only Audit)</option>
              </select>
            </div>
          )}

          {/* Password for Login & Reset */}
          {(mode === 'login' || mode === 'reset') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={mode === 'reset' ? newPassword : password}
                  onChange={e => mode === 'reset' ? setNewPassword(e.target.value) : setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Verify Token */}
          {mode === 'verify' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Confirmation Code</label>
              <input
                type="text"
                required
                maxLength={6}
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value)}
                placeholder="492019"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-center font-mono tracking-widest text-base text-cyan-300 focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-lg transition flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Processing Security Token...' : (
              mode === 'login' ? 'Authenticate & Enter SOC' :
              mode === 'register' ? 'Submit Provisioning Request' :
              mode === 'verify' ? 'Confirm & Grant Access' :
              mode === 'forgot' ? 'Send Recovery Instructions' :
              'Update & Store Password'
            )}
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <div>
              Need an enterprise account?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Register Organization
              </button>
            </div>
          ) : (
            <div>
              Already provisioned?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-cyan-400 hover:text-cyan-300 font-medium"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
