import { Router } from 'express';
import { getProduct, listProducts } from '../controllers/product.controller.js';
import { validate } from '../middlewares/validate.js';
import { listProductsQuery, slugParams } from '../validators/catalogue.validators.js';

const router = Router();

// validate(...) runs first; the controller only receives clean values in req.validated.
router.get('/', validate({ query: listProductsQuery }), listProducts);
router.get('/:slug', validate({ params: slugParams }), getProduct);

export default router;
