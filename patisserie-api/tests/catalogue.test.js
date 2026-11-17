import request from 'supertest';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../scripts/seed.js';
import { Category } from '../src/models/index.js';
import { startTestDb, stopTestDb } from './helpers/db.js';

const app = createApp();
const get = (url) => request(app).get(`/api/v1${url}`);

// 20 seeded products, 2 of them hidden out of season (Zlabia, Mkharek).
const VISIBLE_PRODUCTS = 18;

beforeAll(async () => {
  await startTestDb();
  await seedDatabase({ adminEmail: 'admin@patisserie.tn', adminPassword: 'Admin2026' });
});
afterAll(stopTestDb);

describe('GET /categories', () => {
  it('lists the visible categories alphabetically with their visible product count', async () => {
    const res = await get('/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.map((c) => [c.slug, c.productCount])).toEqual([
      ['baklawa-et-fruits-secs', 6],
      ['douceurs-au-miel', 3],
      ['gateaux-secs', 6],
      ['plateaux-de-fete', 3],
    ]);
  });
});

describe('GET /products', () => {
  it('returns the first page of visible products with pagination', async () => {
    const res = await get('/products');
    expect(res.status).toBe(200);
    expect(res.body.pagination).toEqual({ page: 1, limit: 12, total: VISIBLE_PRODUCTS, totalPages: 2 });
    expect(res.body.data).toHaveLength(12);
    expect(res.body.data[0]).toEqual(
      expect.objectContaining({
        slug: expect.any(String),
        priceMillimes: expect.any(Number),
        inStock: expect.any(Boolean),
        category: expect.objectContaining({ slug: expect.any(String), name: expect.any(String) }),
      }),
    );
    expect(res.body.data[0]).not.toHaveProperty('__v');

    const page2 = await get('/products?page=2');
    expect(page2.body.data).toHaveLength(VISIBLE_PRODUCTS - 12);
    const slugs = new Set([...res.body.data, ...page2.body.data].map((p) => p.slug));
    expect(slugs.size).toBe(VISIBLE_PRODUCTS);
    expect(slugs.has('zlabia')).toBe(false);
  });

  it('filters by occasion, without hidden seasonal products', async () => {
    const res = await get('/products?occasion=ramadan&limit=50');
    expect(res.status).toBe(200);
    const names = res.body.data.map((p) => p.name);
    expect(names).toEqual(expect.arrayContaining(['Makroudh aux dattes', 'Samsa aux amandes']));
    expect(names).not.toContain('Zlabia');
    expect(res.body.data.every((p) => p.occasions.includes('ramadan'))).toBe(true);
  });

  it('filters by category slug and by unit', async () => {
    const byCategory = await get('/products?category=gateaux-secs&limit=50');
    expect(byCategory.body.pagination.total).toBe(6);
    expect(byCategory.body.data.every((p) => p.category.slug === 'gateaux-secs')).toBe(true);

    const boxes = await get('/products?unit=box&limit=50');
    expect(boxes.body.data.length).toBeGreaterThan(0);
    expect(boxes.body.data.every((p) => p.unit === 'box' && p.weightGrams > 0)).toBe(true);
  });

  it('searches name and description, case-insensitively and literally', async () => {
    const res = await get('/products?search=BAKLAWA');
    expect(res.body.data.map((p) => p.slug)).toEqual(expect.arrayContaining(['baklawa-aux-amandes', 'baklawa-aux-pistaches']));
    expect(res.body.data.every((p) => `${p.name} ${p.description}`.toLowerCase().includes('baklawa'))).toBe(true);

    const regexChars = await get(`/products?search=${encodeURIComponent('.*')}`);
    expect(regexChars.status).toBe(200);
    expect(regexChars.body.pagination.total).toBe(0);
  });

  it('filters a price range in millimes and sorts by price', async () => {
    const res = await get('/products?minPrice=30000&maxPrice=50000&sort=price_asc&limit=50');
    const prices = res.body.data.map((p) => p.priceMillimes);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices.every((p) => p >= 30000 && p <= 50000)).toBe(true);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));

    const desc = await get('/products?sort=price_desc&limit=1');
    expect(desc.body.data[0].slug).toBe('plateau-de-mariage-assorti');
  });

  it('sorts by name with French rules (accents ignored)', async () => {
    const res = await get('/products?sort=name&limit=50');
    const names = res.body.data.map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' })));
  });

  it('rejects invalid filters with 422 VALIDATION_ERROR and the failing fields', async () => {
    const res = await get('/products?occasion=christmas&limit=500&sort=cheapest');
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details.map((d) => d.field).sort()).toEqual(['limit', 'occasion', 'sort']);

    const range = await get('/products?minPrice=50000&maxPrice=10000');
    expect(range.status).toBe(422);
    expect(range.body.details[0].field).toBe('maxPrice');
  });

  it('returns 404 CATEGORY_NOT_FOUND for an unknown category', async () => {
    const res = await get('/products?category=pizzas');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category "pizzas" not found' });
  });
});

describe('GET /products/:slug', () => {
  it('returns the product detail with its category, ingredients and allergens', async () => {
    const res = await get('/products/baklawa-aux-pistaches');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      name: 'Baklawa aux pistaches',
      unit: 'kg',
      priceMillimes: 89000,
      inStock: true,
      category: { slug: 'baklawa-et-fruits-secs', name: 'Baklawa & fruits secs' },
      occasions: ['aid', 'wedding'],
    });
    expect(res.body.data.allergens).toContain('gluten');
  });

  it('returns 404 PRODUCT_NOT_FOUND for a hidden or unknown product', async () => {
    for (const slug of ['zlabia', 'pizza-margherita']) {
      const res = await get(`/products/${slug}`);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
    }
  });

  it('returns 422 for a malformed slug', async () => {
    const res = await get('/products/Not_A_Slug!');
    expect(res.status).toBe(422);
    expect(res.body.details[0].field).toBe('slug');
  });
});

describe('hidden category', () => {
  it('hides the category and all of its products from the shop window', async () => {
    await Category.updateOne({ slug: 'plateaux-de-fete' }, { isActive: false });
    try {
      const categories = await get('/categories');
      expect(categories.body.data.map((c) => c.slug)).not.toContain('plateaux-de-fete');

      const products = await get('/products?limit=50');
      expect(products.body.pagination.total).toBe(VISIBLE_PRODUCTS - 3);

      expect((await get('/products?category=plateaux-de-fete')).status).toBe(404);
      expect((await get('/products/plateau-de-mariage-assorti')).status).toBe(404);
    } finally {
      await Category.updateOne({ slug: 'plateaux-de-fete' }, { isActive: true });
    }
  });
});
