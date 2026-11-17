import { asyncHandler } from '../utils/asyncHandler.js';
import * as productService from '../services/product.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  res.json(await productService.listProducts(req.validated.query));
});

export const getProduct = asyncHandler(async (req, res) => {
  res.json({ data: await productService.getProductBySlug(req.validated.params.slug) });
});
