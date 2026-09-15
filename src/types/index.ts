export type UserRole = 
  | 'Super Admin' 
  | 'Security Admin' 
  | 'Security Analyst' 
  | 'Organization Admin' 
  | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  lastLogin: string;
}

export interface Organization {
  id: string;
  name: string;
  domain: string;
  industry: 'Banking' | 'FinTech' | 'E-Commerce' | 'Government' | 'Technology' | 'Enterprise';
  tier: 'Starter' | 'Business' | 'Enterprise';
  riskScore: number; // 0 - 100
  wafStatus: 'Operational' | 'Degraded' | 'Offline';
  firewallStatus: 'Operational' | 'Degraded' | 'Offline';
}

export type ThreatSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type ThreatAction = 'Allowed' | 'Blocked' | 'Challenged' | 'Logged';
export type IncidentStatus = 'New' | 'Investigating' | 'Contained' | 'Resolved' | 'Closed';

export interface SystemHealth {
  wafEngine: 'Operational' | 'Degraded' | 'Offline';
  firewall: 'Operational' | 'Degraded' | 'Offline';
  threatDetection: 'Operational' | 'Degraded' | 'Offline';
  database: 'Operational' | 'Degraded' | 'Offline';
  api: 'Operational' | 'Degraded' | 'Offline';
  monitoring: 'Operational' | 'Degraded' | 'Offline';
  webSocket: 'Operational' | 'Degraded' | 'Offline';
  threatIntelligence: 'Operational' | 'Degraded' | 'Offline';
  lastHeartbeat: string;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  source?: string;
  sourceIp: string;
  sourceCountry?: string;
  sourceCountryCode?: string;
  destination: string;
  destinationIp?: string;
  application: string;
  threat: string;
  threatName?: string;
  category: 'WAF' | 'Firewall' | 'Authentication' | 'Network' | 'Endpoint' | 'API' | 'System' | 'IDS/IPS' | string;
  eventType?: string;
  severity: ThreatSeverity | string;
  action: ThreatAction | string;
  status: 'Detected' | 'Mitigated' | 'Under Review' | string;
  uri?: string;
  method?: string;
  protocol?: string;
  port?: number;
  statusCode?: number;
  payloadSnippet?: string;
  metadata?: Record<string, any>;
}

export interface LiveTrafficEntry {
  id: string;
  timestamp: string;
  sourceIp: string;
  destination: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'CONNECT' | string;
  uri: string;
  protocol: 'HTTP/2' | 'HTTP/3' | 'HTTPS' | 'TCP' | 'UDP' | string;
  port: number;
  country: string;
  countryCode: string;
  threatScore: number; // 0-100
  action: ThreatAction | string;
}

export interface ThreatItem {
  id: string;
  timestamp: string;
  sourceIp: string;
  target: string;
  attackType: string;
  category?: string;
  severity: ThreatSeverity | string;
  confidence: number; // e.g. 98%
  action: ThreatAction | string;
  status: 'Active' | 'Blocked' | 'Investigating' | 'Resolved' | 'MITIGATED' | 'NEW' | 'CONTAINED' | string;
  summary: string;
  detectionReason?: string;
  detectionSource?: string;
  affectedApplication: string;
  destination?: string;
  timeline?: { time: string; event: string }[];
  relatedEvents?: string[];
  recommendedAction?: string;
  mitre?: {
    techniqueId: string;
    techniqueName: string;
    tactic: string;
    description: string;
  };
}

export interface WafRule {
  id: string;
  name: string;
  category: 'OWASP Core' | 'SQL Injection' | 'XSS Filter' | 'Rate Limiting' | 'Bot Protection' | 'Geo Blocking' | 'Custom Policy';
  severity: ThreatSeverity;
  action: 'Block' | 'Allow' | 'Log' | 'Challenge';
  status: 'Active' | 'Disabled';
  lastTriggered: string;
  description: string;
  hitCount: number;
}

export interface ProtectedApplication {
  id: string;
  name: string;
  domain: string;
  originIp?: string;
  ipAddress?: string;
  environment?: 'Production' | 'Staging' | 'Development' | string;
  owner?: string;
  protocol?: string;
  port?: number;
  wafStatus?: 'Protected' | 'Monitoring' | 'Offline' | 'ACTIVE' | string;
  tlsStatus?: string;
  health?: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'UNKNOWN' | string;
  threatLevel?: ThreatSeverity | string;
  requests24h?: number;
  blocked24h?: number;
  responseTime?: number;
  sslExpiry?: string;
  createdAt?: string;
  lastSeen?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | string;
  source: 'waf' | 'firewall' | 'suricata' | 'system' | 'auth' | 'agent' | string;
  eventType?: string;
  message: string;
  host?: string;
  ip?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  rawLog?: string;
}

export interface FirewallRule {
  id: string;
  priority: number;
  source: string;
  destination: string;
  port: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY';
  action: 'ALLOW' | 'DENY' | 'LOG';
  status: 'Active' | 'Disabled';
  created: string;
  description: string;
}

export interface NetworkInventory {
  id: string;
  name: string;
  cidr: string;
  gateway: string;
  devicesCount: number;
  firewall: string;
  status: 'Online' | 'Warning' | 'Offline';
  riskLevel: ThreatSeverity;
  zone: 'DMZ' | 'Internal Core' | 'Database Cluster' | 'Payment Gateway' | 'Edge Proxy';
}

export interface Incident {
  id: string;
  title: string;
  severity: ThreatSeverity;
  status: IncidentStatus;
  created: string;
  assignedAnalyst: string;
  affectedAsset: string;
  relatedThreatsCount: number;
  timeline: { time: string; note: string; author: string }[];
  notes: string;
  recommendedMitigation: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  severity: ThreatSeverity;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface AuditLogItem {
  id: string;
  user: string;
  role: string;
  action: 'Login' | 'Logout' | 'Create Policy' | 'Update Rule' | 'Delete Rule' | 'Change Permission' | 'Add Application' | 'Remove Application' | 'Export Report' | 'Apply AI Recommendation';
  resource: string;
  timestamp: string;
  ip: string;
  result: 'Success' | 'Denied' | 'Failed';
}

export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  permissions: string[];
  status: 'Active' | 'Revoked';
}

export interface ThreatIntelligenceFeed {
  id: string;
  indicator: string; // IP, Domain, Hash
  type: 'Malicious IP' | 'C2 Server' | 'Phishing Domain' | 'Botnet Node' | 'Cryptominer';
  threatScore: number;
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  reportedBy: string;
  status: 'Active' | 'Monitored';
}

export interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  version: string;
  controlsCount: number;
  alignedCount: number;
  coveragePercentage: number;
  status: 'Aligned' | 'In Review';
  keyControls: { id: string; name: string; status: 'Aligned' | 'Needs Review'; description: string }[];
}
