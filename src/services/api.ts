import { 
  SystemHealth, 
  SecurityEvent, 
  ThreatItem, 
  WafRule, 
  ProtectedApplication, 
  FirewallRule, 
  NetworkInventory, 
  Incident, 
  AuditLogItem, 
  ApiKeyItem, 
  ThreatIntelligenceFeed,
  User
} from '../types';

export type BackendConnectionStatus = 'ONLINE' | 'BACKEND OFFLINE';
export type RealtimeStreamStatus = 'CONNECTED' | 'RECONNECTING' | 'REAL-TIME CONNECTION LOST';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

let forceBackendOffline = false;
let activeAuthToken: string | null = null;
let activeOrganizationId: string = 'org_mandiri_01';

export function setSimulatedOffline(offline: boolean) {
  forceBackendOffline = offline;
  notifyConnectivityChange();
  if (offline) {
    globalRealtimeClient.disconnect();
  } else {
    globalRealtimeClient.connect();
  }
}

export function isSimulatedOffline() {
  return forceBackendOffline;
}

export function setAuthToken(token: string | null) {
  activeAuthToken = token;
}

export function setActiveOrganization(orgId: string) {
  activeOrganizationId = orgId;
  globalRealtimeClient.setOrganization(orgId);
}

type ConnectivityListener = (status: BackendConnectionStatus) => void;
const connectivityListeners: Set<ConnectivityListener> = new Set();

export function onConnectivityChange(fn: ConnectivityListener) {
  connectivityListeners.add(fn);
  return () => connectivityListeners.delete(fn);
}

function notifyConnectivityChange() {
  const status: BackendConnectionStatus = forceBackendOffline ? 'BACKEND OFFLINE' : 'ONLINE';
  connectivityListeners.forEach(fn => fn(status));
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  if (forceBackendOffline) {
    throw new Error('BACKEND OFFLINE');
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-organization-id': activeOrganizationId,
      ...(options?.headers as any || {})
    };

    if (activeAuthToken) {
      headers['Authorization'] = `Bearer ${activeAuthToken}`;
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      if (res.status >= 500) {
        notifyConnectivityChange();
      }
      throw new Error(`API HTTP Error: ${res.status} ${res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    if (err.message !== 'BACKEND OFFLINE') {
      notifyConnectivityChange();
    }
    throw err;
  }
}

// API Service Functions
export const securityApi = {
  async getHealth() {
    return request<{ status: string; service: string }>('/api/health');
  },

  async getSystemStatus(): Promise<SystemHealth> {
    return request<SystemHealth>('/api/system/status');
  },

  async getSystemHealthDetailed() {
    return request<{ services: Array<{ service_name: string; status: string; latency_ms: number; last_check: string; details: string }> }>('/api/system/health');
  },

  async getOrganizations() {
    return request<{ organizations: any[] }>('/api/organizations');
  },

  async getDashboardSummary() {
    return request<{
      requests: number;
      blocked: number;
      allowed: number;
      threats: number;
      critical: number;
      applications: number;
      networks: number;
      securityScore: number | null;
      securityScoreStatus: string;
      securityScoreGrade: string;
    }>('/api/dashboard/summary');
  },

  async getDashboard() {
    return request<{
      metrics: {
        protectedAppsCount: number;
        protectedNetworksCount: number;
        requestsToday: number;
        blockedRequests: number;
        activeThreats: number;
        criticalAlerts: number;
        securityEventsCount: number;
        securityScore: number | null;
      };
      trafficHistory: { hour: string; allowed: number; blocked: number; suspicious: number }[];
      threatOverview: { critical: number; high: number; medium: number; low: number };
      recentEvents: SecurityEvent[];
      systemHealth?: SystemHealth;
    }>('/api/dashboard');
  },

  async getSecurityScore() {
    return request<{
      score: number | null;
      grade: string;
      status: 'OPTIMAL' | 'GOOD' | 'NEEDS_ATTENTION' | 'CRITICAL' | 'INSUFFICIENT DATA';
      breakdown: {
        wafCoverage: number;
        firewallCoverage: number;
        threatPosture: number;
        incidentResolution: number;
        engineHealth: number;
        mfaEnforcement: number;
      };
      factors: Array<{
        name: string;
        weight: number;
        score: number;
        status: 'Pass' | 'Warning' | 'Fail';
        details: string;
      }>;
      calculatedAt: string;
    }>('/api/security-score');
  },

  async getWafData() {
    return request<{
      status: string;
      protectedDomainsCount: number;
      totalRequests24h: number;
      blockedRequests24h: number;
      rateLimited24h: number;
      challenged24h: number;
      rules: WafRule[];
      protectedApplications: ProtectedApplication[];
      topCategories: Array<{ category: string; count: number }>;
    }>('/api/waf');
  },

  async getWafRules() {
    return request<{ rules: WafRule[] }>('/api/waf/rules');
  },

  async toggleWafRule(ruleId: string, status?: 'Active' | 'Disabled', enabled?: boolean) {
    return request<{ success: boolean; rule: WafRule }>('/api/waf/rules/toggle', {
      method: 'POST',
      body: JSON.stringify({ ruleId, status, enabled }),
    });
  },

  async createWafRule(rule: Partial<WafRule>) {
    return request<{ success: boolean; rule: WafRule }>('/api/waf/rules/create', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  },

  async getFirewallData() {
    return request<{
      status: string;
      activeConnections: number;
      blockedConnections: number;
      allowedConnections: number;
      rules: FirewallRule[];
      networkZones: NetworkInventory[];
    }>('/api/firewall');
  },

  async createFirewallRule(rule: Partial<FirewallRule>) {
    return request<{ success: boolean; rule: FirewallRule }>('/api/firewall/rules', {
      method: 'POST',
      body: JSON.stringify(rule),
    });
  },

  async toggleFirewallRule(ruleId: string, enabled: boolean) {
    return request<{ success: boolean; rule: FirewallRule }>('/api/firewall/rules/toggle', {
      method: 'POST',
      body: JSON.stringify({ ruleId, enabled }),
    });
  },

  async getThreats(params?: { severity?: string; attackType?: string; category?: string; search?: string; status?: string; application?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.severity) q.append('severity', params.severity);
    if (params?.attackType) q.append('attackType', params.attackType);
    if (params?.category) q.append('category', params.category);
    if (params?.search) q.append('search', params.search);
    if (params?.status) q.append('status', params.status);
    if (params?.application) q.append('application', params.application);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<{ threats: ThreatItem[]; total: number; page?: number; limit?: number; metrics?: { total: number; critical: number; high: number; medium: number; low: number; unresolved: number } }>(`/api/threats?${q.toString()}`);
  },

  async getThreatDetail(id: string) {
    return request<ThreatItem & { relatedEventsDetails?: SecurityEvent[]; mitre?: any }>(`/api/threats/${id}`);
  },

  async updateThreatStatus(threatId: string, status: string) {
    return request<{ success: boolean; threat: ThreatItem }>(`/api/threats/${threatId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
  },

  async mitigateThreat(threatId: string, action: string = 'BLOCK') {
    return request<{ success: boolean; threatId: string; status: string }>('/api/threats/mitigate', {
      method: 'POST',
      body: JSON.stringify({ threatId, action }),
    });
  },

  async getSecurityEvents(params?: { category?: string; source?: string; severity?: string; action?: string; status?: string; search?: string; application?: string; eventType?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.source) q.append('source', params.source);
    if (params?.severity) q.append('severity', params.severity);
    if (params?.action) q.append('action', params.action);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    if (params?.application) q.append('application', params.application);
    if (params?.eventType) q.append('eventType', params.eventType);
    if (params?.startDate) q.append('startDate', params.startDate);
    if (params?.endDate) q.append('endDate', params.endDate);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<{ events: SecurityEvent[]; total: number; page?: number; limit?: number; metrics?: { total: number; critical: number; high: number; medium: number; low: number; allowed: number; blocked: number } }>(`/api/events?${q.toString()}`);
  },

  async getSecurityEventDetail(id: string) {
    return request<SecurityEvent & { ruleId?: string; ruleName?: string; description?: string; rawEvent?: string; relatedEvents?: any[] }>(`/api/events/${id}`);
  },

  async getApplications(params?: { environment?: string; status?: string; search?: string }) {
    const q = new URLSearchParams();
    if (params?.environment) q.append('environment', params.environment);
    if (params?.status) q.append('status', params.status);
    if (params?.search) q.append('search', params.search);
    return request<{ applications: ProtectedApplication[]; total: number; metrics?: { total: number; protected: number; monitoring: number; offline: number; unknown: number } }>(`/api/applications?${q.toString()}`);
  },

  async getApplicationDetail(id: string) {
    return request<{ application: ProtectedApplication; recentEvents: SecurityEvent[]; activeThreats: ThreatItem[] }>(`/api/applications/${id}`);
  },

  async checkApplicationHealth(id: string) {
    return request<{ id: string; name: string; domain: string; status: string; responseTime: number; lastCheckedAt: string }>(`/api/applications/${id}/health`, {
      method: 'POST'
    });
  },

  async createApplication(app: Partial<ProtectedApplication>) {
    return request<{ success: boolean; application: ProtectedApplication }>('/api/applications', {
      method: 'POST',
      body: JSON.stringify(app),
    });
  },

  async getLogs(params?: { level?: string; source?: string; eventType?: string; host?: string; search?: string; page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.level) q.append('level', params.level);
    if (params?.source) q.append('source', params.source);
    if (params?.eventType) q.append('eventType', params.eventType);
    if (params?.host) q.append('host', params.host);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<{ logs: any[]; total: number; page: number; limit: number; metrics: any }>(`/api/logs?${q.toString()}`);
  },

  async getLogDetail(id: string) {
    return request<any>(`/api/logs/${id}`);
  },

  async getNetworks() {
    return request<{ networks: NetworkInventory[]; count: number }>('/api/networks');
  },

  async createNetwork(network: Partial<NetworkInventory>) {
    return request<{ success: boolean; network: NetworkInventory }>('/api/networks', {
      method: 'POST',
      body: JSON.stringify(network),
    });
  },

  async getIncidents() {
    return request<{ incidents: Incident[] }>('/api/incidents');
  },

  async createIncident(incident: { title: string; severity: string; assignedTo?: string; affectedAsset?: string; notes?: string }) {
    return request<{ success: boolean; incident: Incident }>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incident),
    });
  },

  async updateIncidentStatus(id: string, status: string, note?: string, analyst?: string) {
    return request<{ success: boolean; incident: Incident }>(`/api/incidents/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, note, analyst }),
    });
  },

  async getThreatIntel() {
    return request<{ configured: boolean; feeds: ThreatIntelligenceFeed[]; status: string }>('/api/threat-intel');
  },

  async lookupThreatIntel(query: string, type: 'ip' | 'domain' | 'url' = 'ip') {
    return request<{ configured: boolean; indicator: string; type: string; message?: string; data?: any }>(
      `/api/threat-intel/lookup?query=${encodeURIComponent(query)}&type=${type}`
    );
  },

  async getIntegrations() {
    return request<{ integrations: any[] }>('/api/integrations');
  },

  async saveIntegration(provider: string, config: any) {
    return request<{ success: boolean; integration: any }>('/api/integrations', {
      method: 'POST',
      body: JSON.stringify({ provider, ...config })
    });
  },

  async getUsers() {
    return request<{ users: User[] }>('/api/users');
  },

  async getAuditLogs() {
    return request<{ logs: AuditLogItem[] }>('/api/audit-logs');
  },

  async getApiKeys() {
    return request<{ keys: ApiKeyItem[] }>('/api/api-keys');
  },

  async createApiKey(name: string, permissions: string[]) {
    return request<{ success: boolean; key: ApiKeyItem; fullSecretOnce: string }>('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, permissions }),
    });
  },

  async generateReport(type: string, dateRange: string, format: 'PDF' | 'CSV') {
    return request<{
      success: boolean;
      reportId: string;
      generatedAt: string;
      type: string;
      dateRange: string;
      format: string;
      dataSummary: any;
    }>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ type, dateRange, format }),
    });
  },

  async sendDevTestEvent(testType: 'sqli' | 'xss' | 'ssh_brute' | 'normal' = 'sqli') {
    return request<{ success: boolean; message: string; event: any }>('/api/dev/test-event', {
      method: 'POST',
      body: JSON.stringify({ testType }),
    });
  },

  async analyzeWithAI(event: any, promptContext?: string) {
    return request<{
      success: boolean;
      mode: string;
      analysis: {
        summary: string;
        severityExplanation: string;
        threatActorProfile: string;
        mitreTechnique: string;
        recommendedPolicy: {
          ruleName: string;
          category: string;
          action: string;
          syntax: string;
        };
        requiresAnalystApproval: boolean;
      };
    }>('/api/ai/analyze-event', {
      method: 'POST',
      body: JSON.stringify({ event, promptContext }),
    });
  },

  async analyzeEventWithAi(event: any, promptContext?: string) {
    return this.analyzeWithAI(event, promptContext);
  },

  async getAnalytics() {
    return request<{
      topAttackingIps: Array<{ ip: string; country: string; asn: string; count: number; threat: string }>;
      topTargetedApps: Array<{ name: string; requests: number; blocked: number; pctBlocked: string }>;
      responseCodes: Array<{ code: string; count: number; pct: string; color: string }>;
    }>('/api/analytics');
  }
};

// ======================================================================
// Real-Time WebSocket & SSE Client with Automatic Fallback & Reconnect
// ======================================================================
export class RealtimeClientManager {
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private retryAttempt = 0;
  private maxBackoffMs = 20000;
  private baseBackoffMs = 1500;
  private reconnectTimer: any = null;
  private listeners: Set<(data: any) => void> = new Set();
  private statusListeners: Set<(status: RealtimeStreamStatus) => void> = new Set();
  private currentStatus: RealtimeStreamStatus = 'RECONNECTING';
  private orgId: string = 'org_mandiri_01';

  constructor() {
    this.connect();
  }

  public getStatus(): RealtimeStreamStatus {
    return this.currentStatus;
  }

  public setOrganization(orgId: string) {
    this.orgId = orgId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'SUBSCRIBE_ORG', organizationId: orgId }));
    }
  }

  public onData(fn: (data: any) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  public onStatusChange(fn: (status: RealtimeStreamStatus) => void) {
    this.statusListeners.add(fn);
    fn(this.currentStatus);
    return () => this.statusListeners.delete(fn);
  }

  public subscribe(onMessage: (data: any) => void, onError?: (err: any) => void) {
    const unsubData = this.onData(onMessage);
    const unsubStatus = this.onStatusChange(status => {
      if (status === 'REAL-TIME CONNECTION LOST' && onError) {
        onError(new Error('Connection lost'));
      }
    });
    return () => {
      unsubData();
      unsubStatus();
    };
  }

  private setStatus(s: RealtimeStreamStatus) {
    this.currentStatus = s;
    this.statusListeners.forEach(fn => fn(s));
  }

  public connect() {
    if (forceBackendOffline) {
      this.setStatus('REAL-TIME CONNECTION LOST');
      return;
    }

    this.setStatus('RECONNECTING');

    // Attempt WebSocket connection first
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws?org=${encodeURIComponent(this.orgId)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.retryAttempt = 0;
        this.setStatus('CONNECTED');
        if (this.ws) {
          this.ws.send(JSON.stringify({ type: 'SUBSCRIBE_ORG', organizationId: this.orgId }));
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.listeners.forEach(fn => fn(payload));
        } catch (err) {
          console.warn('[Realtime WS] Parse error:', err);
        }
      };

      this.ws.onerror = () => {
        // Switch to SSE fallback if WS fails
        this.fallbackToSSE();
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };
    } catch {
      this.fallbackToSSE();
    }
  }

  private fallbackToSSE() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }

    try {
      if (this.sse) {
        this.sse.close();
      }

      this.sse = new EventSource(`${API_BASE}/api/stream/telemetry`);

      this.sse.onopen = () => {
        this.retryAttempt = 0;
        this.setStatus('CONNECTED');
      };

      this.sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.listeners.forEach(fn => fn(payload));
        } catch (err) {
          console.warn('[Realtime SSE] Parse error:', err);
        }
      };

      this.sse.onerror = () => {
        this.handleDisconnect();
      };
    } catch {
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    if (this.sse) {
      try { this.sse.close(); } catch {}
      this.sse = null;
    }

    this.setStatus('REAL-TIME CONNECTION LOST');

    const delay = Math.min(
      this.baseBackoffMs * Math.pow(1.6, this.retryAttempt),
      this.maxBackoffMs
    );
    this.retryAttempt++;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  public disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try { this.ws.close(); } catch {}
      this.ws = null;
    }
    if (this.sse) {
      try { this.sse.close(); } catch {}
      this.sse = null;
    }
    this.setStatus('REAL-TIME CONNECTION LOST');
  }
}

export const globalRealtimeClient = new RealtimeClientManager();
export const globalTelemetryStream = globalRealtimeClient;
export const telemetryStreamManager = globalRealtimeClient;
