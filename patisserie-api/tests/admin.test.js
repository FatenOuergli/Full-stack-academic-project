import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../scripts/seed.js';
import { startTestDb, stopTestDb } from './helpers/db.js';
import { ADMIN, CUSTOMER, login } from './helpers/auth.js';

const app = createApp();
const api = request(app);
let adminToken;
let customerToken;

beforeAll(async () => {
  await startTestDb();
  await seedDatabase({ adminEmail: ADMIN.email, adminPassword: ADMIN.password });
  adminToken = (await login(app, ADMIN)).token;
  customerToken = (await login(app, CUSTOMER)).token;
});
afterAll(stopTestDb);

const asAdmin = (req) => req.set('Authorization', `Bearer ${adminToken}`);
const asCustomer = (req) => req.set('Authorization', `Bearer ${customerToken}`);
const newAdmin = { email: 'hela.manager@patisserie.tn', password: 'Baklawa2026', firstName: 'Hela', lastName: 'Mansour' };

describe('admin gate', () => {
  it.each([
    ['get', '/api/v1/admin/users'],
    ['post', '/api/v1/admin/admins'],
  ])('%s %s: 401 without a token, 403 for a customer', async (method, url) => {
    const anonymous = await api[method](url);
    expect(anonymous.status).toBe(401);
    const customer = await asCustomer(api[method](url)).send(newAdmin);
    expect(customer.status).toBe(403);
    expect(customer.body.code).toBe('FORBIDDEN');
  });
});

describe('GET /admin/users', () => {
  it('lists users with pagination and no secrets', async () => {
    const res = await asAdmin(api.get('/api/v1/admin/users'));
    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 1, limit: 20, total: 3, totalPages: 1 });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|refreshToken/);
  });

  it('filters by role and searches by name or email', async () => {
    const customers = await asAdmin(api.get('/api/v1/admin/users?role=customer'));
    expect(customers.body.data.map((u) => u.role)).toEqual(['customer', 'customer']);
    const search = await asAdmin(api.get('/api/v1/admin/users?search=TRABELSI'));
    expect(search.body.data.map((u) => u.email)).toEqual(['youssef.trabelsi@example.tn']);
  });

  it('validates the query', async () => {
    const res = await asAdmin(api.get('/api/v1/admin/users?role=chef&limit=0'));
    expect(res.status).toBe(422);
  });
});

describe('POST /admin/admins', () => {
  it('creates an admin who can log in and use the back-office', async () => {
    const res = await asAdmin(api.post('/api/v1/admin/admins')).send(newAdmin);
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(expect.objectContaining({ email: newAdmin.email, role: 'admin' }));

    const { token, user } = await login(app, newAdmin);
    expect(user.role).toBe('admin');
    const users = await api.get('/api/v1/admin/users').set('Authorization', `Bearer ${token}`);
    expect(users.status).toBe(200);
  });

  it('refuses a duplicate email and a weak password', async () => {
    const duplicate = await asAdmin(api.post('/api/v1/admin/admins')).send({ ...newAdmin, email: CUSTOMER.email });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('EMAIL_TAKEN');
    const weak = await asAdmin(api.post('/api/v1/admin/admins')).send({ ...newAdmin, email: 'x@patisserie.tn', password: 'password' });
    expect(weak.status).toBe(422);
  });
});
