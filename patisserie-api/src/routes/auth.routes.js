import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { loginBody, registerBody } from '../validators/auth.validators.js';

const router = Router();

router.post('/register', validate({ body: registerBody }), auth.register);
router.post('/login', validate({ body: loginBody }), auth.login);
router.post('/refresh', auth.refresh);
router.post('/logout', authenticate, auth.logout);

export default router;
