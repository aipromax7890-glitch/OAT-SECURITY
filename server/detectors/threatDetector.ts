import { db } from '../database/db';
import { NormalizedSecurityEvent } from '../parsers/suricataParser';
import { SecurityEventBus } from '../utils/eventBus';

export interface ThreatRecord {
  id: string;
  organizationId: string;
  timestamp: string;
  sourceIp: string;
  target: string;
  attackType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  action: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'MITIGATED' | 'BLOCKED';
  summary: string;
  detectionReason: string;
  affectedApplication: string;
  destination: string;
  relatedEvents: string[];
  recommendedAction: string;
}

export function processSecurityEvent(event: NormalizedSecurityEvent) {
  // 1. Persist to security_events table
  const insertEvent = db.prepare(`
    INSERT INTO security_events (
      id, organization_id, timestamp, source, event_type, severity,
      source_ip, destination_ip, protocol, application, action,
      uri, method, port, status_code, threat_name, payload_snippet, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvent.run(
    event.id,
    event.organizationId,
    event.timestamp,
    event.source,
    event.eventType,
    event.severity,
    event.sourceIp,
    event.destinationIp,
    event.protocol,
    event.application,
    event.action,
    event.uri || null,
    event.method || null,
    event.port || null,
    event.statusCode || null,
    event.threatName || null,
    event.payloadSnippet || null,
    event.metadata ? JSON.stringify(event.metadata) : null
  );

  // 1b. Ingest into Centralized Logs table
  const logLevel = event.severity === 'Critical' ? 'CRITICAL'
    : (event.severity === 'High' || ['BLOCK', 'DENY', 'DROP'].includes(event.action)) ? 'ERROR'
    : (event.severity === 'Medium' || ['CHALLENGE', 'RATE_LIMIT'].includes(event.action)) ? 'WARN'
    : (event.severity === 'Low') ? 'INFO' : 'DEBUG';

  const logId = `LOG-${crypto.randomUUID()}`;
  const logMessage = `[${event.source.toUpperCase()}] ${event.threatName || event.eventType}: ${event.method ? event.method + ' ' : ''}${event.uri || ''} (${event.sourceIp} -> ${event.destinationIp}) action=${event.action}`;
  
  try {
    db.prepare(`
      INSERT INTO logs (
        id, organization_id, timestamp, level, source, event_type,
        message, host, ip, correlation_id, metadata, raw_log
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      logId,
      event.organizationId,
      event.timestamp,
      logLevel,
      event.source,
      event.eventType,
      logMessage,
      'edge-gateway-01',
      event.sourceIp,
      event.id,
      event.metadata ? JSON.stringify(event.metadata) : null,
      JSON.stringify(event)
    );

    const logItem = {
      id: logId,
      organizationId: event.organizationId,
      timestamp: event.timestamp,
      level: logLevel,
      source: event.source,
      eventType: event.eventType,
      message: logMessage,
      host: 'edge-gateway-01',
      ip: event.sourceIp,
      correlationId: event.id,
      metadata: event.metadata,
      rawLog: JSON.stringify(event)
    };
    SecurityEventBus.publish('log.created', logItem, event.organizationId);
  } catch (logErr) {
    console.warn('[ThreatDetector] Error inserting log:', logErr);
  }

  // Emit event to EventBus
  SecurityEventBus.publish('security_event.created', event, event.organizationId);
  SecurityEventBus.publish('security_event', event, event.organizationId);
  if (event.source === 'waf') {
    SecurityEventBus.publish('waf.event', event, event.organizationId);
  } else if (event.source === 'firewall') {
    SecurityEventBus.publish('firewall.event', event, event.organizationId);
  }

  // 2. Threat Evaluation
  const isAttackOrDenied = ['BLOCK', 'DENY', 'DROP', 'CHALLENGE', 'RATE_LIMIT'].includes(event.action) ||
    event.severity === 'High' || event.severity === 'Critical';

  if (isAttackOrDenied) {
    let attackCategory = 'Policy Violation';
    const threatLower = (event.threatName || '').toLowerCase();
    const uriLower = (event.uri || '').toLowerCase();

    if (threatLower.includes('sql') || uriLower.includes('select') || uriLower.includes('union')) {
      attackCategory = 'Web Attack (SQL Injection)';
    } else if (threatLower.includes('xss') || uriLower.includes('<script')) {
      attackCategory = 'Web Attack (Cross-Site Scripting)';
    } else if (threatLower.includes('traversal') || uriLower.includes('../')) {
      attackCategory = 'Web Attack (Path Traversal)';
    } else if (threatLower.includes('bot') || threatLower.includes('scrape') || event.action === 'CHALLENGE') {
      attackCategory = 'Web Attack (Automated Bot / Scraping)';
    } else if (threatLower.includes('rate limit') || event.action === 'RATE_LIMIT') {
      attackCategory = 'Web Attack (Layer 7 Flood)';
    } else if (threatLower.includes('ssh') || event.port === 22 || threatLower.includes('brute force')) {
      attackCategory = 'Authentication Attack (Brute Force)';
    } else if (threatLower.includes('scan') || threatLower.includes('syn')) {
      attackCategory = 'Scanning (Network Reconnaissance)';
    } else if (threatLower.includes('anomaly')) {
      attackCategory = 'Anomaly (Protocol Deviation)';
    } else if (event.source === 'waf') {
      attackCategory = 'Web Attack';
    } else if (event.source === 'firewall') {
      attackCategory = 'Network Attack';
    }

    // Check if there's already an active threat for this source_ip & attack_type in the last 15 minutes
    const existing = db.prepare(`
      SELECT * FROM threats
      WHERE organization_id = ? AND source_ip = ? AND attack_type = ? AND status != 'MITIGATED'
      ORDER BY timestamp DESC LIMIT 1
    `).get(event.organizationId, event.sourceIp, attackCategory) as any;

    if (existing) {
      // Append related event
      let related: string[] = [];
      try {
        related = JSON.parse(existing.related_events || '[]');
      } catch {
        related = [];
      }
      if (!related.includes(event.id)) {
        related.push(event.id);
      }

      db.prepare(`
        UPDATE threats
        SET timestamp = ?, related_events = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(event.timestamp, JSON.stringify(related), existing.id);

      SecurityEventBus.publish('threat.updated', { ...existing, related_events: related }, event.organizationId);
    } else {
      // Create new threat
      const threatId = `THR-${crypto.randomUUID()}`;
      const summary = `Detected ${attackCategory} from origin ${event.sourceIp} targeting ${event.application} (${event.destinationIp}). Mitigated via ${event.action}.`;
      const detectionReason = `Triggered by ${event.source.toUpperCase()} detection: ${event.threatName || 'Suspicious payload match'}.`;
      const confidence = event.severity === 'Critical' ? 99 : event.severity === 'High' ? 95 : 88;
      const recAction = event.action === 'BLOCK' || event.action === 'DENY'
        ? `Maintain IP quarantine for ${event.sourceIp} and review target endpoint parameters.`
        : `Apply rate-limiting and enforce strict WAF deny policy for ${event.sourceIp}.`;

      db.prepare(`
        INSERT INTO threats (
          id, organization_id, timestamp, source_ip, target, attack_type,
          severity, confidence, action, status, summary, detection_reason,
          affected_application, destination, related_events, recommended_action
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        threatId,
        event.organizationId,
        event.timestamp,
        event.sourceIp,
        event.destinationIp,
        attackCategory,
        event.severity,
        confidence,
        event.action,
        'ACTIVE',
        summary,
        detectionReason,
        event.application,
        `${event.destinationIp}:${event.port || 443}`,
        JSON.stringify([event.id]),
        recAction
      );

      const newThreat: ThreatRecord = {
        id: threatId,
        organizationId: event.organizationId,
        timestamp: event.timestamp,
        sourceIp: event.sourceIp,
        target: event.destinationIp,
        attackType: attackCategory,
        severity: event.severity,
        confidence,
        action: event.action,
        status: 'ACTIVE',
        summary,
        detectionReason,
        affectedApplication: event.application,
        destination: `${event.destinationIp}:${event.port || 443}`,
        relatedEvents: [event.id],
        recommendedAction: recAction
      };

      SecurityEventBus.publish('threat.created', newThreat, event.organizationId);
      SecurityEventBus.publish('security.alert', newThreat, event.organizationId);

      // If Critical, also auto-create an Incident in 'NEW' status
      if (event.severity === 'Critical') {
        const incidentId = `INC-${Date.now()}`;
        const title = `Critical Security Incident: ${attackCategory} on ${event.application}`;
        db.prepare(`
          INSERT INTO incidents (
            id, organization_id, title, severity, status, assigned_to,
            affected_asset, notes, timeline
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          incidentId,
          event.organizationId,
          title,
          'Critical',
          'NEW',
          'Unassigned (Triage Queue)',
          event.application,
          `Automated incident spawned by Threat Detection Engine for Threat ID ${threatId}.`,
          JSON.stringify([{
            time: new Date().toLocaleTimeString(),
            note: `Incident spawned automatically: ${attackCategory} detected from ${event.sourceIp}`,
            author: 'Threat Correlation Engine'
          }])
        );

        SecurityEventBus.publish('incident.created', {
          id: incidentId,
          title,
          severity: 'Critical',
          status: 'NEW',
          affected_asset: event.application
        }, event.organizationId);
      }
    }
  }

  return event;
}
