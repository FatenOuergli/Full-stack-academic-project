import { Category, Product } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex } from '../utils/escapeRegex.js';
import { activeCategoryIds, FRENCH_COLLATION } from './category.service.js';

// _id as a tie-breaker keeps pages stable when two products have the same price or date.
const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { priceMillimes: 1, _id: 1 },
  price_desc: { priceMillimes: -1, _id: 1 },
  name: { name: 1, _id: 1 },
};

// What the shop window shows: never internal fields such as __v or timestamps.
function toPublicProduct(p) {
  return {
    id: p._id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    priceMillimes: p.priceMillimes,
    unit: p.unit,
    weightGrams: p.weightGrams,
    stock: p.stock,
    inStock: p.stock > 0,
    images: p.images,
    category: p.category && { id: p.category._id, name: p.category.name, slug: p.category.slug },
    occasions: p.occasions,
    ingredients: p.ingredients,
    allergens: p.allergens,
  };
}

// Visitors only see active products of active categories.
async function buildFilter(query) {
  const filter = { isActive: true };

  if (query.category) {
    const category = await Category.findOne({ slug: query.category, isActive: true }).select('_id').lean();
    if (!category) throw new AppError(404, 'CATEGORY_NOT_FOUND', `Category "${query.category}" not found`);
    filter.category = category._id;
  } else {
    filter.category = { $in: await activeCategoryIds() };
  }

  if (query.occasion) filter.occasions = query.occasion;
  if (query.unit) filter.unit = query.unit;
  if (query.inStock !== undefined) filter.stock = query.inStock ? { $gt: 0 } : 0;

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.priceMillimes = {};
    if (query.minPrice !== undefined) filter.priceMillimes.$gte = query.minPrice;
    if (query.maxPrice !== undefined) filter.priceMillimes.$lte = query.maxPrice;
  }

  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: pattern }, { description: pattern }];
  }
  return filter;
}

export async function listProducts(query) {
  const filter = await buildFilter(query);
  const { page, limit, sort } = query;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .collation(FRENCH_COLLATION)
      .sort(SORTS[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    data: products.map(toPublicProduct),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getProductBySlug(slug) {
  const product = await Product.findOne({ slug, isActive: true }).populate('category', 'name slug isActive').lean();
  if (!product || !product.category?.isActive) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', `Product "${slug}" not found`);
  }
  return toPublicProduct(product);
}
