import { pathToFileURL } from 'node:url';
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, Category, Product, Cart, Order, Payment, Counter } from '../src/models/index.js';
import { nextOrderNumber } from '../src/utils/orderNumber.js';
import * as data from './seedData.js';

const MODELS = [User, Category, Product, Cart, Order, Payment, Counter];

// Wipes the collections and inserts the demo data. Safe to run again at any time.
export async function seedDatabase({ adminEmail, adminPassword }) {
  if (!adminPassword) throw new Error('SEED_ADMIN_PASSWORD is required (see .env.example)');
  // Validate before wiping so a bad password never leaves an empty database.
  const admin = new User({ email: adminEmail, password: adminPassword, firstName: 'Admin', lastName: 'Pâtisserie', role: 'admin' });
  await admin.validate();

  for (const Model of MODELS) {
    await Model.deleteMany({});
    await Model.syncIndexes();
  }

  await admin.save();
  const customers = [];
  for (const c of data.customers) customers.push(await User.create(c));

  const categories = await Category.create(data.categories);
  const products = await Product.create(
    data.products.map((p) => ({ ...p, category: categories[p.category]._id })),
  );
  const byName = new Map(products.map((p) => [p.name, p]));

  const orders = [];
  for (const o of data.orders) {
    const items = o.items.map(({ product, quantity }) => {
      const p = byName.get(product);
      return { product: p._id, name: p.name, unit: p.unit, priceMillimes: p.priceMillimes, quantity };
    });
    const user = o.customer !== undefined ? customers[o.customer] : null;
    const address = user
      ? { fullName: `${user.firstName} ${user.lastName}`, phone: user.phone, ...pick(user.addresses[0]) }
      : o.guestAddress;

    const order = await Order.create({
      orderNumber: await nextOrderNumber(),
      user: user?._id,
      guestEmail: user ? undefined : o.guestEmail,
      items,
      totalMillimes: items.reduce((sum, i) => sum + i.priceMillimes * i.quantity, 0),
      shippingAddress: address,
      status: o.status,
      paymentStatus: o.paymentStatus,
    });
    orders.push(order);

    if (o.paymentStatus === 'paid') {
      await Payment.create({ order: order._id, provider: 'mock', amountMillimes: order.totalMillimes, status: 'succeeded', lastEvent: 'seed' });
    }
  }

  return {
    users: customers.length + 1,
    categories: categories.length,
    products: products.length,
    orders: orders.length,
    payments: await Payment.countDocuments(),
  };
}

function pick(address) {
  const { street, city, governorate, postalCode } = address;
  return { street, city, governorate, postalCode };
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isCli) {
  try {
    await connectDB(env.MONGODB_URI);
    const counts = await seedDatabase({ adminEmail: env.SEED_ADMIN_EMAIL, adminPassword: env.SEED_ADMIN_PASSWORD });
    console.log('Database seeded:', counts);
    console.log(`Admin login: ${env.SEED_ADMIN_EMAIL} (password from SEED_ADMIN_PASSWORD)`);
    console.log(`Customer logins: ${data.customers.map((c) => c.email).join(', ')} (password: Client2026)`);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}
