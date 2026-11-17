import { Category, Product } from '../models/index.js';

export const FRENCH_COLLATION = { locale: 'fr', strength: 1 };

export function activeCategoryIds() {
  return Category.find({ isActive: true }).distinct('_id');
}

// Visible categories, alphabetical, each with its number of visible products.
export async function listCategories() {
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: true }).collation(FRENCH_COLLATION).sort({ name: 1 }).lean(),
    Product.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countById = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((c) => ({
    id: c._id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    productCount: countById.get(String(c._id)) || 0,
  }));
}
