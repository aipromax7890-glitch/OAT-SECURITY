import { db } from '../database/db';

export interface AuditLogParams {
  organizationId: string;
  userId?: string;
  userEmail: string;
  role: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export function recordAuditLog(params: AuditLogParams) {
  try {
    const id = `AUD-${crypto.randomUUID()}`;
    db.prepare(`
      INSERT INTO audit_logs (
        id, organization_id, user_id, user_email, role, action,
        resource, resource_id, ip_address, user_agent, timestamp, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `).run(
      id,
      params.organizationId,
      params.userId || null,
      params.userEmail,
      params.role,
      params.action,
      params.resource,
      params.resourceId || null,
      params.ipAddress || '127.0.0.1',
      params.userAgent || 'OAT Web Console',
      params.metadata ? JSON.stringify(params.metadata) : null
    );
    return id;
  } catch (err) {
    console.error('[AuditService] Failed to record audit log:', err);
    return null;
  }
}
