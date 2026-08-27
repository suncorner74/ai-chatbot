import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { ImageService } from './image.service';

const router = Router();
const service = new ImageService();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { operation, prompt, image } = req.body as { operation?: string; prompt?: string; image?: { mimeType?: string; data?: string } };
    if (!['generate', 'edit', 'enhance'].includes(operation || '')) return res.status(400).json({ error: 'Invalid image operation.' });
    if (operation !== 'generate' && !image?.data) return res.status(400).json({ error: 'An image is required.' });
    if (image?.data && image.data.length > 14_000_000) return res.status(413).json({ error: 'Image payload is too large.' });
    return res.json(await service.generate(operation as 'generate' | 'edit' | 'enhance', String(prompt || ''), image));
  } catch (error) { return next(error); }
});

export default router;
