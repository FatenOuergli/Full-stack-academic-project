import { isDbConnected } from '../config/db.js';

export function getHealth() {
  const database = isDbConnected() ? 'connected' : 'disconnected';
  return {
    status: database === 'connected' ? 'ok' : 'degraded',
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}
