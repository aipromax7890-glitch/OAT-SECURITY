import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/public/LandingPage';
import { AuthView, AuthMode } from './pages/auth/AuthView';
import { DashboardSidebar, DashboardView } from './components/layout/DashboardSidebar';
import { DashboardTopNav } from './components/layout/DashboardTopNav';
import { SearchModal } from './components/common/SearchModal';

// Dashboard Modules
import { DashboardOverview } from './pages/dashboard/DashboardOverview';
import { SecurityOverviewModule } from './pages/dashboard/SecurityOverviewModule';
import { WafModule } from './pages/dashboard/WafModule';
import { FirewallModule } from './pages/dashboard/FirewallModule';
import { ApplicationsModule } from './pages/dashboard/ApplicationsModule';
import { NetworksModule } from './pages/dashboard/NetworksModule';
import { ThreatsModule } from './pages/dashboard/ThreatsModule';
import { SecurityEventsModule } from './pages/dashboard/SecurityEventsModule';
import { LiveTrafficModule } from './pages/dashboard/LiveTrafficModule';
import { CentralizedLogsModule } from './pages/dashboard/CentralizedLogsModule';
import { AnalyticsModule } from './pages/dashboard/AnalyticsModule';
import { ThreatIntelModule } from './pages/dashboard/ThreatIntelModule';
import { IncidentsModule } from './pages/dashboard/IncidentsModule';
import { ReportsModule } from './pages/dashboard/ReportsModule';
import { UsersRolesModule } from './pages/dashboard/UsersRolesModule';
import { IntegrationsModule } from './pages/dashboard/IntegrationsModule';
import { BillingModule } from './pages/dashboard/BillingModule';
import { SettingsModule } from './pages/dashboard/SettingsModule';
import { MalwareAnalysisModule } from './pages/dashboard/MalwareAnalysisModule';
import { AiSecurityAgentModule } from './pages/dashboard/AiSecurityAgentModule';
import { ComplianceModule } from './pages/dashboard/ComplianceModule';
import { AuditLogModule } from './pages/dashboard/AuditLogModule';

const MainContent: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [appMode, setAppMode] = useState<'public' | 'dashboard'>('dashboard');
  const [currentView, setCurrentView] = useState<DashboardView>('dashboard');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Keyboard shortcut Cmd+K or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAuth = (mode: AuthMode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setAppMode('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#080d17] text-slate-100 flex flex-col font-sans">
      {/* If Public Landing Page */}
      {appMode === 'public' ? (
        <LandingPage
          onEnterDashboard={() => setAppMode('dashboard')}
          onOpenAuth={handleOpenAuth}
        />
      ) : (
        /* Enterprise Dashboard Layout */
        <div className="flex h-screen overflow-hidden bg-[#080d17]">
          {/* Sidebar */}
          <DashboardSidebar
            currentView={currentView}
            onSelectView={setCurrentView}
          />

          {/* Right Main Container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top Navigation */}
            <DashboardTopNav
              onOpenSearch={() => setShowSearchModal(true)}
              onTogglePublicView={() => setAppMode('public')}
            />

            {/* Content Scroll View */}
            <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#080d17] custom-scrollbar">
              <div className="max-w-7xl mx-auto">
                {currentView === 'dashboard' && <DashboardOverview onNavigate={setCurrentView} />}
                {currentView === 'security-overview' && <SecurityOverviewModule onNavigate={setCurrentView} />}
                {currentView === 'waf' && <WafModule />}
                {currentView === 'firewall' && <FirewallModule />}
                {currentView === 'applications' && <ApplicationsModule />}
                {currentView === 'networks' && <NetworksModule />}
                {currentView === 'threats' && <ThreatsModule />}
                {currentView === 'security-events' && <SecurityEventsModule />}
                {currentView === 'live-traffic' && <LiveTrafficModule />}
                {currentView === 'logs' && <CentralizedLogsModule />}
                {currentView === 'analytics' && <AnalyticsModule />}
                {currentView === 'threat-intel' && <ThreatIntelModule />}
                {currentView === 'incidents' && <IncidentsModule />}
                {currentView === 'reports' && <ReportsModule />}
                {currentView === 'users-roles' && <UsersRolesModule />}
                {currentView === 'integrations' && <IntegrationsModule />}
                {currentView === 'billing' && <BillingModule />}
                {currentView === 'settings' && <SettingsModule />}
                {currentView === 'malware' && <MalwareAnalysisModule />}
                {currentView === 'ai-agent' && <AiSecurityAgentModule />}
                {currentView === 'compliance' && <ComplianceModule />}
                {currentView === 'audit-log' && <AuditLogModule />}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthView
          initialMode={authMode}
          onSuccess={handleAuthSuccess}
          onCancel={() => setShowAuthModal(false)}
        />
      )}

      {/* Global Search Modal */}
      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={(view) => {
          setAppMode('dashboard');
          setCurrentView(view);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
