import mongoose from 'mongoose';
import { User, Category, Product, Cart, Order } from '../src/models/index.js';
import { nextOrderNumber } from '../src/utils/orderNumber.js';
import { clearTestDb, startTestDb, stopTestDb } from './helpers/db.js';

beforeAll(startTestDb);
afterEach(clearTestDb);
afterAll(stopTestDb);

const validationErrorFields = async (promise) => {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    return Object.keys(err.errors);
  }
  throw new Error('expected a validation error');
};

const address = { street: '1 rue de Rome', city: 'Tunis', governorate: 'Tunis', postalCode: '1000' };

describe('User', () => {
  const base = { email: 'Amira@Example.TN', firstName: 'Amira', lastName: 'Ben Salah' };

  it('hashes the password, lowercases the email and never returns the hash', async () => {
    const user = await User.create({ ...base, password: 'Client2026', phone: '+21622123456' });
    expect(user.email).toBe('amira@example.tn');

    const fromDb = await User.findById(user._id);
    expect(fromDb.passwordHash).toBeUndefined();
    expect(JSON.stringify(fromDb)).not.toContain('passwordHash');

    const withHash = await User.findById(user._id).select('+passwordHash');
    expect(withHash.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    await expect(withHash.comparePassword('Client2026')).resolves.toBe(true);
    await expect(withHash.comparePassword('wrong-pass1')).resolves.toBe(false);
  });

  it('rejects a weak password, a non-Tunisian phone and an unknown governorate', async () => {
    const fields = await validationErrorFields(
      User.create({ ...base, password: 'short', phone: '+33612345678', addresses: [{ ...address, governorate: 'Paris' }] }),
    );
    expect(fields).toEqual(expect.arrayContaining(['password', 'phone', 'addresses.0.governorate']));
  });

  it('keeps emails unique', async () => {
    await User.create({ ...base, password: 'Client2026' });
    await expect(User.create({ ...base, password: 'Client2026' })).rejects.toMatchObject({ code: 11000 });
  });
});

describe('Product', () => {
  let category;
  beforeEach(async () => {
    category = await Category.create({ name: 'Douceurs au miel' });
  });

  it('builds slugs without accents', async () => {
    expect(category.slug).toBe('douceurs-au-miel');
    const p = await Product.create({ name: 'Ghraiba droô', priceMillimes: 30000, unit: 'kg', stock: 5, category: category._id });
    expect(p.slug).toBe('ghraiba-droo');
  });

  it('accepts prices in millimes that are multiples of 100 only', async () => {
    const fields = await validationErrorFields(
      Product.create({ name: 'Makroudh', priceMillimes: 26050, unit: 'kg', stock: 5, category: category._id }),
    );
    expect(fields).toContain('priceMillimes');
  });

  it('requires weightGrams for boxes and a valid unit and occasion', async () => {
    const fields = await validationErrorFields(
      Product.create({ name: 'Mlabes', priceMillimes: 32000, unit: 'box', stock: 5, category: category._id, occasions: ['christmas'] }),
    );
    expect(fields).toEqual(expect.arrayContaining(['weightGrams', 'occasions.0']));
  });
});

describe('Cart', () => {
  it('belongs to exactly one of user or guestId', async () => {
    expect(await validationErrorFields(Cart.create({ items: [] }))).toContain('user');
    expect(
      await validationErrorFields(Cart.create({ user: new mongoose.Types.ObjectId(), guestId: 'abc' })),
    ).toContain('user');
    await expect(Cart.create({ guestId: 'a3c1e2b4-guest' })).resolves.toBeDefined();
  });

  it('has a 30-day TTL index limited to guest carts', async () => {
    const indexes = await Cart.collection.indexes();
    const ttl = indexes.find((i) => i.expireAfterSeconds !== undefined);
    expect(ttl).toMatchObject({ key: { updatedAt: 1 }, expireAfterSeconds: 2592000, partialFilterExpression: { guestId: { $exists: true } } });
  });
});

describe('Order', () => {
  const item = { product: new mongoose.Types.ObjectId(), name: 'Baklawa aux pistaches', unit: 'kg', priceMillimes: 89000, quantity: 2 };
  const shippingAddress = { fullName: 'Amira Ben Salah', phone: '+21622123456', ...address };

  it('stores totals in TND millimes and rejects a total that does not match the items', async () => {
    const order = await Order.create({
      orderNumber: await nextOrderNumber(), guestEmail: 'guest@example.tn', items: [item], totalMillimes: 178000, shippingAddress,
    });
    expect(order).toMatchObject({ currency: 'TND', status: 'pending', paymentStatus: 'unpaid' });

    const fields = await validationErrorFields(
      Order.create({ orderNumber: await nextOrderNumber(), guestEmail: 'g@example.tn', items: [item], totalMillimes: 1000, shippingAddress }),
    );
    expect(fields).toContain('totalMillimes');
  });

  it('needs a user or a guest email', async () => {
    const fields = await validationErrorFields(
      Order.create({ orderNumber: await nextOrderNumber(), items: [item], totalMillimes: 178000, shippingAddress }),
    );
    expect(fields).toContain('user');
  });

  it('only moves statuses forward', () => {
    expect(Order.canTransition('pending', 'paid')).toBe(true);
    expect(Order.canTransition('paid', 'cancelled')).toBe(true);
    expect(Order.canTransition('preparing', 'cancelled')).toBe(false);
    expect(Order.canTransition('delivered', 'pending')).toBe(false);
  });

  it('generates sequential yearly order numbers', async () => {
    const date = new Date('2026-05-01');
    await expect(nextOrderNumber(date)).resolves.toBe('PAT-2026-000001');
    await expect(nextOrderNumber(date)).resolves.toBe('PAT-2026-000002');
  });
});
