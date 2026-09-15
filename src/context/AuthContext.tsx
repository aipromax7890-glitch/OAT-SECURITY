import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Organization } from '../types';
import { setSimulatedOffline, isSimulatedOffline, setActiveOrganization } from '../services/api';

interface AuthContextType {
  user: User | null;
  currentOrg: Organization;
  organizations: Organization[];
  isAuthenticated: boolean;
  login: (email: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  switchOrg: (orgId: string) => void;
  hasPermission: (permission: string) => boolean;
  isBackendOffline: boolean;
  toggleBackendOffline: () => void;
}

const DEFAULT_ORGS: Organization[] = [
  {
    id: 'org_mandiri_01',
    name: 'PT Bank Mandiri (Persero) Tbk',
    domain: 'bankmandiri.co.id',
    industry: 'Banking',
    tier: 'Enterprise',
    riskScore: 94,
    wafStatus: 'Operational',
    firewallStatus: 'Operational'
  },
  {
    id: 'org_fintech_02',
    name: 'FinTech Nusantara Payments',
    domain: 'fintech-nusantara.id',
    industry: 'FinTech',
    tier: 'Enterprise',
    riskScore: 89,
    wafStatus: 'Operational',
    firewallStatus: 'Operational'
  },
  {
    id: 'org_gov_03',
    name: 'National Critical Cyber Infrastructure',
    domain: 'gov.cyber.id',
    industry: 'Government',
    tier: 'Enterprise',
    riskScore: 91,
    wafStatus: 'Operational',
    firewallStatus: 'Operational'
  }
];

const DEFAULT_USER: User = {
  id: 'usr_001',
  name: 'Ahmad Fauzi, CISSP',
  email: 'ahmad.fauzi@bankmandiri.co.id',
  role: 'Security Analyst',
  organizationId: 'org_mandiri_01',
  organizationName: 'PT Bank Mandiri (Persero) Tbk',
  mfaEnabled: true,
  lastLogin: '2026-09-15T12:08:00Z'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [organizations] = useState<Organization[]>(DEFAULT_ORGS);
  const [currentOrg, setCurrentOrg] = useState<Organization>(DEFAULT_ORGS[0]);
  const [isBackendOffline, setIsBackendOffline] = useState(isSimulatedOffline());

  const login = async (email: string, role: UserRole = 'Security Analyst') => {
    setUser({
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email,
      role,
      organizationId: currentOrg.id,
      organizationName: currentOrg.name,
      mfaEnabled: true,
      lastLogin: new Date().toISOString()
    });
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = (role: UserRole) => {
    if (!user) return;
    setUser({ ...user, role });
  };

  useEffect(() => {
    setActiveOrganization(currentOrg.id);
  }, [currentOrg.id]);

  const switchOrg = (orgId: string) => {
    const matched = organizations.find(o => o.id === orgId);
    if (matched) {
      setCurrentOrg(matched);
      setActiveOrganization(matched.id);
      if (user) {
        setUser({ ...user, organizationId: matched.id, organizationName: matched.name });
      }
    }
  };

  const toggleBackendOffline = () => {
    const next = !isBackendOffline;
    setIsBackendOffline(next);
    setSimulatedOffline(next);
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'Super Admin') return true;

    switch (user.role) {
      case 'Security Admin':
        return permission !== 'manage_billing_super' && permission !== 'delete_organization';
      case 'Security Analyst':
        return ['view_telemetry', 'view_waf', 'view_firewall', 'triage_incidents', 'run_ai_analysis', 'export_reports'].includes(permission);
      case 'Organization Admin':
        return ['view_telemetry', 'manage_users', 'view_reports', 'manage_integrations'].includes(permission);
      case 'Viewer':
        return ['view_telemetry', 'view_reports'].includes(permission);
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentOrg,
        organizations,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
        switchOrg,
        hasPermission,
        isBackendOffline,
        toggleBackendOffline
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
