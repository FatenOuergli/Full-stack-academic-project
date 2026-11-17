import { Counter } from '../models/Counter.js';

// Yearly sequence, atomic thanks to findOneAndUpdate + $inc: PAT-2026-000123.
export async function nextOrderNumber(date = new Date()) {
  const year = date.getFullYear();
  const counter = await Counter.findOneAndUpdate(
    { _id: `order-${year}` },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true },
  );
  return `PAT-${year}-${String(counter.seq).padStart(6, '0')}`;
}
