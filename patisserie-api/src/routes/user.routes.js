import { Router } from 'express';
import { getMe, updateMe } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { updateMeBody } from '../validators/user.validators.js';

const router = Router();

// Every /users route needs a logged-in user, so authenticate is applied once for the router.
router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', validate({ body: updateMeBody }), updateMe);

export default router;
