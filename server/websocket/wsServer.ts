import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { SecurityEventBus, BusEventPayload } from '../utils/eventBus';
import { verifyToken } from '../auth/jwt';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  organizationId?: string;
  userRole?: string;
}

export class SecurityWebSocketServer {
  private wss: WebSocketServer | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public init(server: HttpServer) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws',
      perMessageDeflate: false,
      maxPayload: 1024 * 64
    });

    console.log('[WebSocket] Security WebSocket server attached to /ws');

    this.wss.on('connection', (ws: ExtendedWebSocket, req) => {
      ws.isAlive = true;

      // Extract auth / organization from URL query string if present (e.g. /ws?token=...&org=...)
      try {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');
        const org = url.searchParams.get('org');
        if (token) {
          const verified = verifyToken(token);
          if (verified) {
            ws.organizationId = verified.organizationId;
            ws.userRole = verified.role;
          }
        }
        if (org) {
          ws.organizationId = org;
        }
      } catch {
        // Unauthenticated or default socket
      }

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          } else if (msg.type === 'SUBSCRIBE_ORG') {
            ws.organizationId = msg.organizationId;
            ws.send(JSON.stringify({
              type: 'SUBSCRIBED',
              organizationId: msg.organizationId,
              status: 'CONNECTED'
            }));
          } else if (msg.type === 'AUTH') {
            const verified = verifyToken(msg.token);
            if (verified) {
              ws.organizationId = verified.organizationId;
              ws.userRole = verified.role;
              ws.send(JSON.stringify({ type: 'AUTH_OK', user: verified }));
            }
          }
        } catch {
          // Ignore invalid JSON
        }
      });

      // Send initial handshake
      ws.send(JSON.stringify({
        type: 'CONNECTION_STATUS',
        status: 'CONNECTED',
        timestamp: new Date().toISOString()
      }));
    });

    // Heartbeat ping interval every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client) => {
        const extWs = client as ExtendedWebSocket;
        if (!extWs.isAlive) {
          extWs.terminate();
          return;
        }
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);

    // Listen to SecurityEventBus and broadcast to relevant WebSocket clients
    SecurityEventBus.on('event', (payload: BusEventPayload) => {
      this.broadcast(payload);
    });
  }

  public broadcast(payload: BusEventPayload) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: payload.type,
      data: payload.data,
      timestamp: payload.timestamp
    });

    this.wss.clients.forEach((client) => {
      const extWs = client as ExtendedWebSocket;
      if (extWs.readyState === WebSocket.OPEN) {
        // Multi-tenant filter: if event has organizationId and client specified organizationId
        if (
          payload.organizationId &&
          extWs.organizationId &&
          extWs.organizationId !== payload.organizationId &&
          extWs.userRole !== 'Super Admin'
        ) {
          return;
        }

        // Backpressure check: do not flood client if buffer > 1MB
        if (extWs.bufferedAmount > 1024 * 1024) {
          console.warn('[WebSocket] Dropping packet due to client backpressure buffer');
          return;
        }

        try {
          extWs.send(message);
        } catch (e) {
          console.error('[WebSocket] Send error:', e);
        }
      }
    });
  }

  public close() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

export const securityWebSocketServer = new SecurityWebSocketServer();
