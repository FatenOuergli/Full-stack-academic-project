import { seedDatabase } from '../scripts/seed.js';
import { User, Product, Order } from '../src/models/index.js';
import { startTestDb, stopTestDb } from './helpers/db.js';

beforeAll(startTestDb);
afterAll(stopTestDb);

const options = { adminEmail: 'admin@patisserie.tn', adminPassword: 'Admin2026' };
const expected = { users: 3, categories: 4, products: 20, orders: 3, payments: 2 };

describe('seedDatabase', () => {
  it('fills the database with the Tunisian pâtisserie demo data', async () => {
    await expect(seedDatabase(options)).resolves.toEqual(expected);

    const admin = await User.findOne({ role: 'admin' });
    expect(admin.email).toBe('admin@patisserie.tn');

    const baklawa = await Product.findOne({ slug: 'baklawa-aux-pistaches' });
    expect(baklawa).toMatchObject({ unit: 'kg', priceMillimes: 89000 });

    const statuses = (await Order.find().sort({ orderNumber: 1 })).map((o) => [o.orderNumber, o.status]);
    expect(statuses).toEqual([
      [expect.stringMatching(/^PAT-\d{4}-000001$/), 'delivered'],
      [expect.stringMatching(/^PAT-\d{4}-000002$/), 'preparing'],
      [expect.stringMatching(/^PAT-\d{4}-000003$/), 'pending'],
    ]);
  });

  it('can run again and gives the same result', async () => {
    await expect(seedDatabase(options)).resolves.toEqual(expected);
  });

  it('refuses to run without an admin password', async () => {
    await expect(seedDatabase({ adminEmail: 'a@b.tn' })).rejects.toThrow('SEED_ADMIN_PASSWORD');
  });

  it('rejects a weak admin password without touching the existing data', async () => {
    await expect(seedDatabase({ ...options, adminPassword: 'abcdefgh' })).rejects.toThrow();
    expect(await Product.countDocuments()).toBe(expected.products);
  });
});
