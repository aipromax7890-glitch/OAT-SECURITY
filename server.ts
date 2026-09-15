import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { CONFIG } from './server/config';
import { runMigrations } from './server/database/db';
import { suricataTailer } from './server/collectors/suricataTailer';
import { authMiddleware } from './server/middleware/auth';
import { apiRouter } from './server/api/routes';
import { securityWebSocketServer } from './server/websocket/wsServer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Tenant & Auth context middleware
app.use(authMiddleware);

// Run DB migrations
try {
  runMigrations();
} catch (err) {
  console.error('[OAT SECURITY] Database migration error:', err);
}

// Start Suricata eve.json tailer
try {
  suricataTailer.start();
} catch (err) {
  console.warn('[OAT SECURITY] Suricata tailer warning:', err);
}

// Mount REST API routes
app.use('/api', apiRouter);

// Initialize WebSocket server on HTTP server (/ws)
securityWebSocketServer.init(server);

// Vite middleware & SPA Handling
async function startApp() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(CONFIG.PORT, '0.0.0.0', () => {
    console.log(`[OAT SECURITY] Enterprise Server running on http://0.0.0.0:${CONFIG.PORT}`);
    console.log(`[OAT SECURITY] WebSocket active at ws://0.0.0.0:${CONFIG.PORT}/ws`);
  });
}

startApp().catch(err => {
  console.error('[OAT SECURITY] Fatal server startup error:', err);
  process.exit(1);
});
