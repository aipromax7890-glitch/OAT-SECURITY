import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { CONFIG } from '../config';

// Ensure data directory exists
const dbDir = path.dirname(CONFIG.DATABASE_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new DatabaseSync(CONFIG.DATABASE_PATH);

// Enable WAL mode & foreign keys
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
`);

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      industry TEXT NOT NULL DEFAULT 'Enterprise',
      tier TEXT NOT NULL DEFAULT 'Enterprise',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      permission TEXT NOT NULL,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Security Analyst',
      mfa_enabled INTEGER NOT NULL DEFAULT 1,
      mfa_secret TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      origin_ip TEXT NOT NULL DEFAULT '127.0.0.1',
      environment TEXT NOT NULL DEFAULT 'Production',
      status TEXT NOT NULL DEFAULT 'UNKNOWN',
      owner TEXT NOT NULL DEFAULT 'SecOps',
      protocol TEXT NOT NULL DEFAULT 'HTTPS',
      port INTEGER NOT NULL DEFAULT 443,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS networks (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      cidr TEXT NOT NULL,
      gateway TEXT NOT NULL,
      interface TEXT NOT NULL DEFAULT 'eth0',
      description TEXT,
      status TEXT NOT NULL DEFAULT 'Online',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS waf_rules (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Medium',
      action TEXT NOT NULL DEFAULT 'BLOCK',
      enabled INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS firewall_rules (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 100,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      port TEXT NOT NULL DEFAULT 'ANY',
      protocol TEXT NOT NULL DEFAULT 'TCP',
      action TEXT NOT NULL DEFAULT 'DENY',
      enabled INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      created_by TEXT NOT NULL DEFAULT 'system',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Low',
      source_ip TEXT NOT NULL,
      destination_ip TEXT NOT NULL,
      protocol TEXT NOT NULL DEFAULT 'TCP',
      application TEXT NOT NULL DEFAULT 'Perimeter Edge',
      action TEXT NOT NULL DEFAULT 'LOG',
      uri TEXT,
      method TEXT,
      port INTEGER,
      status_code INTEGER,
      threat_name TEXT,
      payload_snippet TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS threats (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      source_ip TEXT NOT NULL,
      target TEXT NOT NULL,
      attack_type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Medium',
      confidence INTEGER NOT NULL DEFAULT 90,
      action TEXT NOT NULL DEFAULT 'LOG',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      summary TEXT NOT NULL,
      detection_reason TEXT,
      affected_application TEXT,
      destination TEXT,
      related_events TEXT,
      recommended_action TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'NEW',
      assigned_to TEXT,
      affected_asset TEXT,
      notes TEXT,
      timeline TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'Info',
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      user_id TEXT,
      user_email TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      resource TEXT NOT NULL,
      resource_id TEXT,
      ip_address TEXT NOT NULL,
      user_agent TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      metadata TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      permissions TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS system_health (
      service_name TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'OPERATIONAL',
      latency_ms REAL NOT NULL DEFAULT 0.0,
      last_check TEXT NOT NULL DEFAULT (datetime('now')),
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS integration_configs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      provider TEXT NOT NULL,
      config_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT CONFIGURED',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS uptime_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      status TEXT NOT NULL,
      latency_ms REAL NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      level TEXT NOT NULL, -- DEBUG, INFO, WARN, ERROR, CRITICAL
      source TEXT NOT NULL, -- Suricata, WAF, Firewall, Authentication, Application, System
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      host TEXT NOT NULL DEFAULT 'edge-gateway-01',
      ip TEXT,
      correlation_id TEXT,
      metadata TEXT,
      raw_log TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON security_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_events_severity ON security_events(severity);
    CREATE INDEX IF NOT EXISTS idx_events_source_ip ON security_events(source_ip);
    CREATE INDEX IF NOT EXISTS idx_events_type ON security_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_org ON security_events(organization_id);

    CREATE INDEX IF NOT EXISTS idx_threats_timestamp ON threats(timestamp);
    CREATE INDEX IF NOT EXISTS idx_threats_org ON threats(organization_id);
    CREATE INDEX IF NOT EXISTS idx_threats_status ON threats(status);

    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_org ON logs(organization_id);
    CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
    CREATE INDEX IF NOT EXISTS idx_logs_source ON logs(source);
    CREATE INDEX IF NOT EXISTS idx_logs_correlation ON logs(correlation_id);

    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(organization_id);
  `);

  // Seed default data if empty
  seedInitialData();
}

function seedInitialData() {
  const orgCheck = db.prepare('SELECT COUNT(*) as count FROM organizations').get() as { count: number };
  if (orgCheck.count > 0) return;

  const defaultOrgId = 'org_mandiri_01';
  db.prepare(`
    INSERT INTO organizations (id, name, domain, industry, tier)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    defaultOrgId,
    'PT Bank Mandiri (Persero) Tbk',
    'bankmandiri.co.id',
    'Banking',
    'Enterprise'
  );

  // Seed secondary organizations for multi-tenant switching
  db.prepare(`
    INSERT INTO organizations (id, name, domain, industry, tier)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'org_fintech_02',
    'FinTech Nusantara Payments',
    'fintech-nusantara.id',
    'FinTech',
    'Enterprise'
  );

  db.prepare(`
    INSERT INTO organizations (id, name, domain, industry, tier)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'org_gov_03',
    'National Critical Cyber Infrastructure',
    'gov.cyber.id',
    'Government',
    'Enterprise'
  );

  // Seed Users with real bcrypt hashes (Password: Admin@12345 or Analyst@12345)
  const adminHash = bcrypt.hashSync('Admin@12345', 10);
  const analystHash = bcrypt.hashSync('Analyst@12345', 10);
  const viewerHash = bcrypt.hashSync('Viewer@12345', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id, organization_id, name, email, password_hash, role, mfa_enabled, last_login)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  insertUser.run('usr_001', defaultOrgId, 'Ahmad Fauzi, CISSP', 'ahmad.fauzi@bankmandiri.co.id', analystHash, 'Security Analyst', 1);
  insertUser.run('usr_002', defaultOrgId, 'Rina Sasmita, CISSP', 'rina.sasmita@bankmandiri.co.id', adminHash, 'Security Admin', 1);
  insertUser.run('usr_003', defaultOrgId, 'Dr. Hendra Gunawan', 'hendra.gunawan@oat-sec.com', adminHash, 'Super Admin', 1);
  insertUser.run('usr_004', 'org_fintech_02', 'Dewi Lestari', 'dewi.lestari@fintech-nusantara.id', adminHash, 'Organization Admin', 1);
  insertUser.run('usr_005', defaultOrgId, 'Eko Prasetyo', 'eko.prasetyo@auditor.co.id', viewerHash, 'Viewer', 1);

  // Seed System Health baseline services
  const insertHealth = db.prepare(`
    INSERT OR REPLACE INTO system_health (service_name, status, latency_ms, last_check, details)
    VALUES (?, ?, ?, datetime('now'), ?)
  `);

  insertHealth.run('API Service', 'OPERATIONAL', 0.8, 'Express REST engine active');
  insertHealth.run('Database Engine', 'OPERATIONAL', 0.3, 'SQLite WAL synchronized');
  insertHealth.run('WebSocket Gateway', 'OPERATIONAL', 0.5, 'Real-time event socket active');
  insertHealth.run('WAF Inspection Engine', 'OPERATIONAL', 1.1, 'OWASP CRS Rule Processor active');
  insertHealth.run('Firewall State Tracker', 'OPERATIONAL', 0.6, 'L3/L4 Packet State Inspection ready');
  insertHealth.run('Suricata Ingest Collector', 'OPERATIONAL', 0.9, 'Eve.json watcher listening');
  insertHealth.run('Threat Correlation Engine', 'OPERATIONAL', 1.4, 'Event Bus Normalizer operational');

  // Seed standard baseline WAF Rules
  const insertWaf = db.prepare(`
    INSERT INTO waf_rules (id, organization_id, rule_id, name, category, severity, action, enabled, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertWaf.run('WAF-R-01', defaultOrgId, 'OWASP-CRS-942100', 'OWASP Core Rule Set - SQL Injection Detection', 'SQL Injection', 'Critical', 'BLOCK', 1, 'Inspects URI, headers, and body for SQL syntax anomalies.');
  insertWaf.run('WAF-R-02', defaultOrgId, 'OWASP-CRS-941100', 'Universal XSS Vector Sanitization & Denial', 'XSS Filter', 'High', 'BLOCK', 1, 'Filters script tags, event handlers, and encoded DOM payload variants.');
  insertWaf.run('WAF-R-03', defaultOrgId, 'OAT-RATELIMIT-01', 'Strict API Rate Limiting (Token Bucket)', 'Rate Limiting', 'Medium', 'CHALLENGE', 1, 'Enforces max 100 requests per 10-second sliding window per unique IP.');
  insertWaf.run('WAF-R-04', defaultOrgId, 'OAT-BOT-01', 'Malicious & Headless Bot Interception', 'Bot Protection', 'High', 'CHALLENGE', 1, 'Challenges untrusted user agents and headless scrapers.');
  insertWaf.run('WAF-R-05', defaultOrgId, 'OWASP-CRS-930100', 'Command Injection & Remote Shell Blocker', 'OWASP Core', 'Critical', 'BLOCK', 1, 'Blocks pipe, ampersand, and shell command invocation syntax.');

  // Seed baseline Firewall Rules
  const insertFw = db.prepare(`
    INSERT INTO firewall_rules (id, organization_id, priority, source, destination, port, protocol, action, enabled, description, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFw.run('FW-010', defaultOrgId, 10, '10.240.0.0/16', '10.240.10.0/24', '443, 8443', 'TCP', 'ALLOW', 1, 'Ingress routing from Cloud Armor Edge Proxy to Core Web Servers', 'System');
  insertFw.run('FW-020', defaultOrgId, 20, 'ANY', '10.240.10.0/24', '22', 'TCP', 'DENY', 1, 'Block direct SSH access from public internet', 'System');
  insertFw.run('FW-030', defaultOrgId, 30, '10.240.10.0/24', '10.240.50.0/24', '5432', 'TCP', 'ALLOW', 1, 'App tier to PostgreSQL database cluster', 'System');
  insertFw.run('FW-040', defaultOrgId, 40, '185.220.0.0/16', 'ANY', 'ANY', 'ANY', 'DENY', 1, 'Blocklisted TOR exit nodes & known bulletproof hosters', 'System');

  // Seed initial application inventory
  const insertApp = db.prepare(`
    INSERT INTO applications (id, organization_id, name, domain, origin_ip, environment, status, owner, protocol, port)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertApp.run('APP-01', defaultOrgId, 'Core Banking API Gateway', 'api.mandiri.oat-sec.net', '172.67.182.90', 'Production', 'ONLINE', 'SecOps Core', 'HTTPS', 443);
  insertApp.run('APP-02', defaultOrgId, 'Corporate Internet Banking Web', 'ib.bankmandiri.co.id', '104.21.78.11', 'Production', 'ONLINE', 'Retail Banking Engineering', 'HTTPS', 443);

  // Seed initial network inventory
  const insertNet = db.prepare(`
    INSERT INTO networks (id, organization_id, name, cidr, gateway, interface, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNet.run('NET-01', defaultOrgId, 'Primary Ingress DMZ Subnet', '10.240.0.0/20', '10.240.0.1', 'eth0', 'Public facing load balancers and reverse proxies', 'Online');
  insertNet.run('NET-02', defaultOrgId, 'Core Transaction Fabric', '10.240.10.0/24', '10.240.10.1', 'eth1', 'Secure backend microservices tier', 'Online');

  // Seed initial audit log for initialization
  db.prepare(`
    INSERT INTO audit_logs (id, organization_id, user_id, user_email, role, action, resource, resource_id, ip_address, user_agent, timestamp, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
  `).run(
    'AUD-INIT-01',
    defaultOrgId,
    'usr_003',
    'system@oat-security.internal',
    'System',
    'Initialize System',
    'OAT Security Engine Database & Security Modules',
    'SYS-INIT',
    '127.0.0.1',
    'OAT Security Core/1.0',
    JSON.stringify({ message: 'Clean security database initialized without mock traffic.' })
  );

  console.log('[OAT SECURITY] Database migrations executed and baseline schema seeded successfully.');
}
