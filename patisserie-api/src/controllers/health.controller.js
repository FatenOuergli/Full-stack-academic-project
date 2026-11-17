import { getHealth } from '../services/health.service.js';

export function health(_req, res) {
  const report = getHealth();
  res.status(report.status === 'ok' ? 200 : 503).json(report);
}
