import { z } from 'zod';
import { OCCASIONS, PRODUCT_UNITS } from '../config/constants.js';

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'name'];

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a lowercase slug, e.g. kaak-warka');
const millimes = z.coerce.number().int().min(0);

export const slugParams = z.object({ slug });

// GET /products?category=&occasion=&unit=&search=&minPrice=&maxPrice=&inStock=&page=&limit=&sort=
export const listProductsQuery = z
  .object({
    category: slug.optional(),
    occasion: z.enum(OCCASIONS).optional(),
    unit: z.enum(PRODUCT_UNITS).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    minPrice: millimes.optional(),
    maxPrice: millimes.optional(),
    inStock: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
    sort: z.enum(PRODUCT_SORTS).default('newest'),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    path: ['maxPrice'],
    message: 'maxPrice must be greater than or equal to minPrice',
  });
