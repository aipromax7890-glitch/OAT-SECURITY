import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const CONFIG = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_PATH: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'oat_security.sqlite'),
  JWT_SECRET: process.env.JWT_SECRET || 'oat_security_enterprise_jwt_secret_key_2026',
  SESSION_SECRET: process.env.SESSION_SECRET || 'oat_security_session_key_2026',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
  SURICATA_EVE_PATH: process.env.SURICATA_EVE_PATH || path.join(process.cwd(), 'data', 'suricata', 'eve.json'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
};
