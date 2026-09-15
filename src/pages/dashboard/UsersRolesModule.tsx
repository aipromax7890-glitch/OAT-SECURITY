import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Mail,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const UsersRolesModule: React.FC = () => {
  const { currentOrg, user } = useAuth();
  const [users, setUsers] = useState([
    { id: 'u1', name: 'Ahmad Fauzi, CISSP', email: 'ahmad.fauzi@bankmandiri.co.id', role: 'Security Analyst' as UserRole, status: 'Active', mfa: 'Enforced', lastLogin: '10 mins ago' },
    { id: 'u2', name: 'Bambang Soediro', email: 'bambang.s@bankmandiri.co.id', role: 'Security Admin' as UserRole, status: 'Active', mfa: 'Enforced', lastLogin: 'Yesterday' },
    { id: 'u3', name: 'Dimas Wicaksono', email: 'dimas.w@bankmandiri.co.id', role: 'Super Admin' as UserRole, status: 'Active', mfa: 'Hardware Key', lastLogin: '2 hours ago' },
    { id: 'u4', name: 'Siti Rahmawati', email: 'siti.r@bankmandiri.co.id', role: 'Organization Admin' as UserRole, status: 'Active', mfa: 'Enforced', lastLogin: '3 days ago' },
    { id: 'u5', name: 'Auditor External (PwC)', email: 'audit.lead@pwc.com', role: 'Viewer' as UserRole, status: 'Active', mfa: 'Enforced', lastLogin: '4 days ago' },
  ]);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Security Analyst');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setUsers(prev => [
      ...prev,
      {
        id: 'u-' + Date.now(),
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
        status: 'Active',
        mfa: 'Pending',
        lastLogin: 'Never'
      }
    ]);
    setShowInviteModal(false);
    setInviteName('');
    setInviteEmail('');
  };

  const permissionsMatrix = [
    { module: 'WAF Rule Modification', superAdmin: true, secAdmin: true, secAnalyst: false, orgAdmin: false, viewer: false },
    { module: 'Firewall Policy & ACL Deploy', superAdmin: true, secAdmin: true, secAnalyst: false, orgAdmin: false, viewer: false },
    { module: 'Threat Triage & IP Block Action', superAdmin: true, secAdmin: true, secAnalyst: true, orgAdmin: false, viewer: false },
    { module: 'Live Ingress Telemetry & SIEM View', superAdmin: true, secAdmin: true, secAnalyst: true, orgAdmin: true, viewer: true },
    { module: 'Compliance & Audit Report Export', superAdmin: true, secAdmin: true, secAnalyst: true, orgAdmin: true, viewer: true },
    { module: 'User Provisioning & Role Assignment', superAdmin: true, secAdmin: false, secAnalyst: false, orgAdmin: true, viewer: false },
    { module: 'Billing, SLA & Subscription Settings', superAdmin: true, secAdmin: false, secAnalyst: false, orgAdmin: true, viewer: false },
    { module: 'AI SOC Agent Triage & Execution', superAdmin: true, secAdmin: true, secAnalyst: true, orgAdmin: false, viewer: false },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Users & Role-Based Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage enterprise operators, multi-factor authentication (MFA), and granular zero trust permissions for {currentOrg.name}.
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Invite Enterprise Member
        </button>
      </div>

      {/* Users Table (Section 16) */}
      <div className="rounded-xl border border-slate-800 bg-[#0d1424] overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-slate-100">Authorized Security Operators ({users.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                <th className="p-3">OPERATOR NAME</th>
                <th className="p-3">CORPORATE EMAIL</th>
                <th className="p-3">RBAC ROLE</th>
                <th className="p-3">MFA STATUS</th>
                <th className="p-3">ACCOUNT STATUS</th>
                <th className="p-3">LAST LOGIN</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-850/50 transition">
                  <td className="p-3 font-sans font-semibold text-slate-100">{u.name}</td>
                  <td className="p-3 text-cyan-300">{u.email}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px]">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400">{u.mfa}</td>
                  <td className="p-3 text-emerald-400">{u.status}</td>
                  <td className="p-3 text-slate-400">{u.lastLogin}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => alert(`Permissions updated for ${u.name}`)}
                      className="text-xs text-slate-400 hover:text-slate-200 font-sans px-2 py-1 rounded bg-slate-900 border border-slate-800"
                    >
                      Edit Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Granular RBAC Permissions Matrix (Section 16) */}
      <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Granular Role Permissions Matrix</span>
            </h3>
            <p className="text-xs text-slate-400">Strict segregation of duties enforced across the OAT platform.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-slate-400">
                <th className="p-3 font-sans">SECURITY CAPABILITY</th>
                <th className="p-3 text-center">SUPER ADMIN</th>
                <th className="p-3 text-center">SECURITY ADMIN</th>
                <th className="p-3 text-center">SECURITY ANALYST</th>
                <th className="p-3 text-center">ORG ADMIN</th>
                <th className="p-3 text-center">VIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-850/50 transition">
                  <td className="p-3 font-sans text-slate-200">{item.module}</td>
                  <td className="p-3 text-center">
                    {item.superAdmin ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {item.secAdmin ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {item.secAnalyst ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {item.orgAdmin ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                  <td className="p-3 text-center">
                    {item.viewer ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-[#080d17]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0e1628] shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-100 mb-1">Invite Enterprise Security Operator</h3>
            <p className="text-xs text-slate-400 mb-4">Provision credentials with mandatory corporate MFA challenge.</p>

            <form onSubmit={handleInvite} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={e => setInviteName(e.target.value)}
                  placeholder="e.g. Raden Sukoco, CEH"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="operator@bankmandiri.co.id"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Role</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200"
                >
                  <option value="Security Analyst">Security Analyst</option>
                  <option value="Security Admin">Security Admin</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Organization Admin">Organization Admin</option>
                  <option value="Viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 shadow-md"
                >
                  Issue Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
