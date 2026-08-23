import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { login, logout, me, register } from './auth.controller';

const router = Router();
const asyncHandler = (handler: any) => (req: any, res: any, next: any) => Promise.resolve(handler(req, res)).catch(next);

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/logout', requireAuth, asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));

export default router;
