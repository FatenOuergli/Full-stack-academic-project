import request from 'supertest';

export const ADMIN = { email: 'admin@patisserie.tn', password: 'Admin2026' };
export const CUSTOMER = { email: 'amira.bensalah@example.tn', password: 'Client2026' };

// Logs in and returns the access token plus the refresh cookie ("refreshToken=...").
export async function login(app, credentials) {
  const res = await request(app).post('/api/v1/auth/login').send(credentials);
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  const cookie = res.headers['set-cookie'].find((c) => c.startsWith('refreshToken='));
  return { token: res.body.data.accessToken, cookie: cookie.split(';')[0], user: res.body.data.user };
}
