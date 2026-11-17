import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../scripts/seed.js';
import { startTestDb, stopTestDb } from './helpers/db.js';
import { ADMIN, CUSTOMER, login } from './helpers/auth.js';

const app = createApp();
const api = request(app);
let token;

beforeAll(async () => {
  await startTestDb();
  await seedDatabase({ adminEmail: ADMIN.email, adminPassword: ADMIN.password });
  ({ token } = await login(app, CUSTOMER));
});
afterAll(stopTestDb);

const me = () => api.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);
const patchMe = (body) => api.patch('/api/v1/users/me').set('Authorization', `Bearer ${token}`).send(body);

const sfax = { label: 'Bureau', street: '12 rue Habib Thameur', city: 'Sfax', governorate: 'Sfax', postalCode: '3000' };
const nabeul = { label: 'Famille', street: '5 avenue de la Plage', city: 'Hammamet', governorate: 'Nabeul', postalCode: '8050' };

describe('GET /users/me', () => {
  it('returns the profile without secrets', async () => {
    const res = await me();
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(expect.objectContaining({ email: CUSTOMER.email, role: 'customer', firstName: 'Amira' }));
    expect(res.body.data.addresses[0]).toEqual(expect.objectContaining({ governorate: expect.any(String), id: expect.any(String) }));
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|refreshToken|__v/);
  });

  it('needs a token', async () => {
    expect((await api.get('/api/v1/users/me')).status).toBe(401);
  });
});

describe('PATCH /users/me', () => {
  it('updates names, phone and addresses; the first address becomes the default', async () => {
    const res = await patchMe({ firstName: 'Amira-Sarra', phone: '+21622000111', addresses: [sfax, nabeul] });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(expect.objectContaining({ firstName: 'Amira-Sarra', lastName: 'Ben Salah', phone: '+21622000111' }));
    expect(res.body.data.addresses.map((a) => [a.city, a.isDefault, a.country])).toEqual([
      ['Sfax', true, 'TN'],
      ['Hammamet', false, 'TN'],
    ]);
    expect((await me()).body.data.firstName).toBe('Amira-Sarra');
  });

  it('keeps the default chosen by the customer and can remove the phone', async () => {
    const res = await patchMe({ phone: null, addresses: [sfax, { ...nabeul, isDefault: true }] });
    expect(res.status).toBe(200);
    expect(res.body.data.phone).toBeUndefined();
    expect(res.body.data.addresses.map((a) => a.isDefault)).toEqual([false, true]);
  });

  it('ignores email and role', async () => {
    const res = await patchMe({ firstName: 'Amira', email: 'hacker@example.tn', role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(expect.objectContaining({ email: CUSTOMER.email, role: 'customer' }));
  });

  it('validates Tunisian addresses and the single default', async () => {
    const res = await patchMe({
      phone: '0022123456',
      addresses: [{ ...sfax, governorate: 'Paris', postalCode: '75001' }],
    });
    expect(res.status).toBe(422);
    expect(res.body.details.map((d) => d.field).sort()).toEqual(['addresses.0.governorate', 'addresses.0.postalCode', 'phone']);

    const twoDefaults = await patchMe({ addresses: [{ ...sfax, isDefault: true }, { ...nabeul, isDefault: true }] });
    expect(twoDefaults.status).toBe(422);
    expect(twoDefaults.body.details).toEqual([{ field: 'addresses', message: 'only one address can be the default' }]);
  });

  it('refuses an empty update and more than 5 addresses', async () => {
    expect((await patchMe({})).status).toBe(422);
    expect((await patchMe({ addresses: Array(6).fill(sfax) })).status).toBe(422);
  });
});
