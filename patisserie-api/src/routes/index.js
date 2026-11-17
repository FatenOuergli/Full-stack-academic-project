import { Router } from 'express';
import healthRoutes from './health.routes.js';

// One express.Router() per resource, all mounted under /api/v1 in app.js.
const router = Router();

router.use('/health', healthRoutes);

export default router;
