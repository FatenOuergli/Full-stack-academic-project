import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
import { seedDatabase } from '../scripts/seed.js';
import { User } from '../src/models/index.js';
import { startTestDb, stopTestDb } from './helpers/db.js';
import { ADMIN, CUSTOMER, login } from './helpers/auth.js';

const app = createApp();
const api = request(app);
const newCustomer = {
  email: 'Leila.Haddad@Example.tn',
  password: 'Makroudh2026',
  firstName: 'Leila',
  lastName: 'Haddad',
  phone: '+21698765432',
};

beforeAll(async () => {
  await startTestDb();
  await seedDatabase({ adminEmail: ADMIN.email, adminPassword: ADMIN.password });
});
afterAll(stopTestDb);

const refreshCookie = (res) => res.headers['set-cookie']?.find((c) => c.startsWith('refreshToken='));

describe('POST /auth/register', () => {
  it('creates a customer, returns an access token and sets the refresh cookie', async () => {
    const res = await api.post('/api/v1/auth/register').send({ ...newCustomer, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.user).toEqual(
      expect.objectContaining({ email: 'leila.haddad@example.tn', role: 'customer', firstName: 'Leila' }),
    );
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(jwt.verify(res.body.data.accessToken, env.JWT_ACCESS_SECRET)).toEqual(
      expect.objectContaining({ sub: res.body.data.user.id, role: 'customer' }),
    );

    const cookie = refreshCookie(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);

    const stored = await User.findOne({ email: 'leila.haddad@example.tn' }).select('+refreshTokenHash').lean();
    expect(stored.refreshTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(cookie).not.toContain(stored.refreshTokenHash);
  });

  it('refuses an email that is already used', async () => {
    const res = await api.post('/api/v1/auth/register').send({ ...newCustomer, email: CUSTOMER.email });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('validates the input', async () => {
    const res = await api.post('/api/v1/auth/register').send({ email: 'nope', password: 'short', firstName: '', phone: '22123456' });
    expect(res.status).toBe(422);
    expect(res.body.details.map((d) => d.field).sort()).toEqual(['email', 'firstName', 'lastName', 'password', 'phone']);
  });
});

describe('POST /auth/login', () => {
  it('logs in a customer and an admin', async () => {
    const customer = await login(app, CUSTOMER);
    expect(customer.user.role).toBe('customer');
    const admin = await login(app, ADMIN);
    expect(admin.user.role).toBe('admin');
  });

  it('accepts the email in any case', async () => {
    const res = await api.post('/api/v1/auth/login').send({ ...CUSTOMER, email: CUSTOMER.email.toUpperCase() });
    expect(res.status).toBe(200);
  });

  it('gives the same answer for a wrong password and an unknown email', async () => {
    const wrongPassword = await api.post('/api/v1/auth/login').send({ ...CUSTOMER, password: 'Wrong2026' });
    const unknownEmail = await api.post('/api/v1/auth/login').send({ email: 'nobody@example.tn', password: 'Wrong2026' });
    for (const res of [wrongPassword, unknownEmail]) {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
      expect(refreshCookie(res)).toBeUndefined();
    }
  });

  it('refuses a disabled account', async () => {
    await User.create({ email: 'old@example.tn', password: 'Disabled2026', firstName: 'Old', lastName: 'Account', isActive: false });
    const res = await api.post('/api/v1/auth/login').send({ email: 'old@example.tn', password: 'Disabled2026' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('POST /auth/refresh', () => {
  it('issues a new access token and rotates the refresh token', async () => {
    const { cookie } = await login(app, CUSTOMER);

    const first = await api.post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(first.status).toBe(200);
    expect(first.body.data.accessToken).toEqual(expect.any(String));
    const rotated = refreshCookie(first).split(';')[0];
    expect(rotated).not.toBe(cookie);

    // The old token was used once already: it no longer works.
    const reused = await api.post('/api/v1/auth/refresh').set('Cookie', cookie);
    expect(reused.status).toBe(401);
    expect(reused.body.code).toBe('INVALID_REFRESH_TOKEN');
    expect(refreshCookie(reused)).toMatch(/refreshToken=;/);

    const second = await api.post('/api/v1/auth/refresh').set('Cookie', rotated);
    expect(second.status).toBe(200);
  });

  it('refuses a missing, unknown or expired refresh token', async () => {
    expect((await api.post('/api/v1/auth/refresh')).status).toBe(401);
    expect((await api.post('/api/v1/auth/refresh').set('Cookie', 'refreshToken=made-up')).status).toBe(401);

    const { cookie } = await login(app, CUSTOMER);
    await User.updateOne({ email: CUSTOMER.email }, { refreshTokenExpiresAt: new Date(Date.now() - 1000) });
    expect((await api.post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(401);
  });

  it('only keeps the latest session (logging in again replaces the previous refresh token)', async () => {
    const first = await login(app, CUSTOMER);
    await login(app, CUSTOMER);
    expect((await api.post('/api/v1/auth/refresh').set('Cookie', first.cookie)).status).toBe(401);
  });
});

describe('POST /auth/logout', () => {
  it('needs an access token', async () => {
    const res = await api.post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('revokes the refresh token and clears the cookie', async () => {
    const { token, cookie } = await login(app, CUSTOMER);
    const res = await api.post('/api/v1/auth/logout').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    expect(refreshCookie(res)).toMatch(/refreshToken=;/);
    expect((await api.post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(401);
  });
});

describe('authenticate middleware', () => {
  it('refuses expired, forged and malformed tokens', async () => {
    const { user } = await login(app, CUSTOMER);
    const expired = jwt.sign({ role: 'customer' }, env.JWT_ACCESS_SECRET, { subject: user.id, issuer: 'patisserie-api', expiresIn: -10 });
    const forged = jwt.sign({ role: 'admin' }, 'another-secret-that-is-also-long-enough!', { subject: user.id, issuer: 'patisserie-api' });
    const unsigned = jwt.sign({ role: 'admin' }, null, { subject: user.id, issuer: 'patisserie-api', algorithm: 'none' });

    const call = (header) => api.get('/api/v1/users/me').set('Authorization', header);
    expect((await call(`Bearer ${expired}`)).body.code).toBe('TOKEN_EXPIRED');
    for (const header of [`Bearer ${forged}`, `Bearer ${unsigned}`, 'Bearer abc.def.ghi']) {
      const res = await call(header);
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('INVALID_TOKEN');
    }
    expect((await call(`Basic ${expired}`)).body.code).toBe('AUTH_REQUIRED');
  });

  it('stops a valid token as soon as the account is disabled', async () => {
    await User.create({ email: 'soon.disabled@example.tn', password: 'Active2026', firstName: 'Soon', lastName: 'Disabled' });
    const { token } = await login(app, { email: 'soon.disabled@example.tn', password: 'Active2026' });
    await User.updateOne({ email: 'soon.disabled@example.tn' }, { isActive: false });
    const res = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
