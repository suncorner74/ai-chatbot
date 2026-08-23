import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { createRateLimiter } from '../../middleware/rate-limit';
import { login, logout, me, register } from './auth.controller';

const router = Router();
const asyncHandler = (handler: any) => (req: any, res: any, next: any) => Promise.resolve(handler(req, res)).catch(next);

router.post('/register', createRateLimiter(5, 60 * 60, 'auth-register'), asyncHandler(register));
router.post('/login', createRateLimiter(5, 60, 'auth-login'), asyncHandler(login));
router.post('/logout', requireAuth, asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
