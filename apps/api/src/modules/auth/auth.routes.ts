import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { login, logout, me, register } from './auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

export default router;
