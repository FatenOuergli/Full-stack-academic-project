import { Router } from 'express';
import healthRoutes from './health.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';

// One express.Router() per resource, all mounted under /api/v1 in app.js.
const router = Router();

router.use('/health', healthRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);

export default router;
