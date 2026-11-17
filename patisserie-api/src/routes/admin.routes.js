import { Router } from 'express';
import { createAdmin, listUsers } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createAdminBody, listUsersQuery } from '../validators/user.validators.js';

const router = Router();

// The back-office gate: first "who are you?" (401), then "are you an admin?" (403).
// Placed before every /admin route, so no admin route can forget it.
router.use(authenticate, authorize('admin'));

router.get('/users', validate({ query: listUsersQuery }), listUsers);
router.post('/admins', validate({ body: createAdminBody }), createAdmin);

export default router;
