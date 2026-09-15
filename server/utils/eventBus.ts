import { EventEmitter } from 'events';

export type SecurityEventType =
  | 'security.alert'
  | 'security_event'
  | 'security_event.created'
  | 'security_event.updated'
  | 'application.created'
  | 'application.updated'
  | 'application.health_changed'
  | 'threat.created'
  | 'threat.updated'
  | 'log.created'
  | 'incident.created'
  | 'incident.updated'
  | 'system.health_changed'
  | 'waf.event'
  | 'firewall.event'
  | 'network.event'
  | 'authentication.event'
  | 'system.health'
  | 'rule.updated'
  | 'metric.tick';

export interface BusEventPayload {
  type: SecurityEventType;
  data: any;
  organizationId?: string;
  timestamp: string;
}

class SecurityEventBusEmitter extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  public publish(type: SecurityEventType, data: any, organizationId?: string) {
    const payload: BusEventPayload = {
      type,
      data,
      organizationId,
      timestamp: new Date().toISOString()
    };
    this.emit('event', payload);
    this.emit(type, payload);
  }
}

export const SecurityEventBus = new SecurityEventBusEmitter();
