import request from 'supertest';
import { createApp } from '../src/app.js';
import { startTestDb, stopTestDb } from './helpers/db.js';

const app = createApp();

beforeAll(startTestDb);
afterAll(stopTestDb);

describe('GET /api/v1/health', () => {
  it('reports the API and database as up', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'connected' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});

describe('standard error shape', () => {
  it('returns 404 NOT_FOUND for an unknown route', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 404, code: 'NOT_FOUND', message: 'Route GET /api/v1/does-not-exist not found' });
  });

  it('returns 400 INVALID_JSON for a malformed body', async () => {
    const res = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, code: 'INVALID_JSON' });
  });
});

describe('CORS', () => {
  it('allows only the Angular origin, with credentials', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:4200');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:4200');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });
});

describe('Swagger UI', () => {
  it('is served at /api/docs', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger-ui');
  });
});
