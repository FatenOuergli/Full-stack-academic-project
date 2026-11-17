import { Router } from 'express';
import healthRoutes from './health.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';

// One express.Router() per resource, all mounted under /api/v1 in app.js.
const router = Router();

router.use('/health', healthRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);

export default router;
