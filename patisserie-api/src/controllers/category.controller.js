import { asyncHandler } from '../utils/asyncHandler.js';
import * as categoryService from '../services/category.service.js';

export const listCategories = asyncHandler(async (_req, res) => {
  res.json({ data: await categoryService.listCategories() });
});
