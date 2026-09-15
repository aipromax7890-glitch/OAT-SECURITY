export interface NormalizedSecurityEvent {
  id: string;
  organizationId: string;
  timestamp: string;
  source: 'suricata' | 'waf' | 'firewall' | 'auth' | 'system';
  eventType: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  sourceIp: string;
  destinationIp: string;
  protocol: string;
  application: string;
  action: 'ALLOW' | 'BLOCK' | 'DENY' | 'DROP' | 'CHALLENGE' | 'RATE_LIMIT' | 'LOG';
  uri?: string;
  method?: string;
  port?: number;
  statusCode?: number;
  threatName?: string;
  payloadSnippet?: string;
  metadata?: Record<string, any>;
}

export function parseSuricataEve(raw: any, organizationId = 'org_mandiri_01'): NormalizedSecurityEvent | null {
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || typeof data !== 'object') return null;

    const eventType = data.event_type || 'alert';
    const timestamp = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();
    const sourceIp = data.src_ip || '0.0.0.0';
    const destinationIp = data.dest_ip || '0.0.0.0';
    const protocol = (data.proto || 'TCP').toUpperCase();
    const port = data.dest_port || data.src_port || undefined;

    let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Medium';
    let action: 'ALLOW' | 'BLOCK' | 'DENY' | 'DROP' | 'CHALLENGE' | 'RATE_LIMIT' | 'LOG' = 'LOG';
    let threatName = `${eventType.toUpperCase()} Event`;
    let payloadSnippet = undefined;
    let uri = undefined;
    let method = undefined;

    if (eventType === 'alert' && data.alert) {
      threatName = data.alert.signature || 'Suricata IDS Alert';
      const prio = Number(data.alert.severity) || 3;
      if (prio === 1) severity = 'Critical';
      else if (prio === 2) severity = 'High';
      else if (prio === 3) severity = 'Medium';
      else severity = 'Low';

      action = data.alert.action === 'blocked' || data.alert.action === 'drop' ? 'BLOCK' : 'LOG';
      payloadSnippet = data.payload_printable || (data.alert.metadata ? JSON.stringify(data.alert.metadata) : undefined);
    } else if (eventType === 'http' && data.http) {
      threatName = `HTTP ${data.http.http_method || 'Request'}`;
      severity = 'Low';
      uri = data.http.url;
      method = data.http.http_method;
      action = 'ALLOW';
    } else if (eventType === 'dns' && data.dns) {
      threatName = `DNS Query ${data.dns.rrname || ''}`;
      severity = 'Low';
      action = 'ALLOW';
    } else if (eventType === 'tls' && data.tls) {
      threatName = `TLS Handshake ${data.tls.subject || ''}`;
      severity = 'Low';
      action = 'ALLOW';
    } else if (eventType === 'anomaly' && data.anomaly) {
      threatName = data.anomaly.event || 'Network Protocol Anomaly';
      severity = 'High';
      action = 'DROP';
    }

    return {
      id: `EV-SUR-${crypto.randomUUID()}`,
      organizationId,
      timestamp,
      source: 'suricata',
      eventType,
      severity,
      sourceIp,
      destinationIp,
      protocol,
      application: data.app_proto || 'Network Sensor',
      action,
      uri,
      method,
      port,
      statusCode: data.http?.status,
      threatName,
      payloadSnippet,
      metadata: {
        raw_event_type: eventType,
        flow_id: data.flow_id,
        in_iface: data.in_iface,
        tx_id: data.tx_id,
        community_id: data.community_id
      }
    };
  } catch (err) {
    console.error('Failed to parse Suricata eve record:', err);
    return null;
  }
}
