import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { DocumentService } from './document.service';

const router = Router();
const service = new DocumentService();

function errorStatus(error: unknown): number {
  const code = error instanceof Error ? error.message : '';
  if (code === 'DOCUMENT_NOT_FOUND' || code === 'KNOWLEDGE_BASE_NOT_FOUND') return 404;
  if (code === 'UNSUPPORTED_DOCUMENT_TYPE' || code === 'DOCUMENT_TOO_LARGE' || code === 'INVALID_DOCUMENT_NAME') return 400;
  if (code === 'DOCUMENT_EMPTY') return 422;
  return 500;
}

router.use(requireAuth);

router.post('/knowledge-bases', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    if (!name) { res.status(400).json({ error: { code: 'INVALID_KNOWLEDGE_BASE', message: 'Knowledge base name is required.' } }); return; }
    const kb = await service.createKnowledgeBase(req.user!.id, name, typeof req.body?.description === 'string' ? req.body.description : undefined);
    res.status(201).json({ knowledgeBase: kb });
  } catch { res.status(400).json({ error: { code: 'INVALID_KNOWLEDGE_BASE', message: 'Unable to create knowledge base.' } }); }
});
router.get('/knowledge-bases', async (req, res) => { res.json({ knowledgeBases: await service.listKnowledgeBases(req.user!.id) }); });
router.get('/knowledge-bases/:id', async (req, res) => {
  const kb = await service.getKnowledgeBase(req.user!.id, req.params.id);
  if (!kb) { res.status(404).json({ error: { code: 'KNOWLEDGE_BASE_NOT_FOUND', message: 'Knowledge base not found.' } }); return; }
  res.json({ knowledgeBase: kb });
});
router.delete('/knowledge-bases/:id', async (req, res) => {
  try { await service.removeKnowledgeBase(req.user!.id, req.params.id); res.status(204).send(); }
  catch { res.status(404).json({ error: { code: 'KNOWLEDGE_BASE_NOT_FOUND', message: 'Knowledge base not found.' } }); }
});

router.post('/', (req, res) => {
  const name = String(req.headers['x-filename'] || '').trim();
  const mimeType = String(req.headers['content-type'] || '').split(';')[0].trim();
  const knowledgeBaseId = typeof req.query.knowledgeBaseId === 'string' ? req.query.knowledgeBaseId : undefined;
  const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  service.create(req.user!.id, name, mimeType, buffer, knowledgeBaseId)
    .then((result) => res.status(result.duplicate ? 200 : 202).json(result))
    .catch((error) => {
      const status = errorStatus(error);
      const duplicate = error instanceof Error && error.message === 'DUPLICATE_DOCUMENT';
      res.status(status).json({ error: { code: duplicate ? 'DUPLICATE_DOCUMENT' : error instanceof Error ? error.message : 'DOCUMENT_UPLOAD_FAILED', message: duplicate ? 'This document already exists.' : status >= 500 ? 'Unable to process document.' : 'Invalid document upload.' } });
    });
});

router.get('/', async (req, res) => { res.json({ documents: await service.list(req.user!.id) }); });
router.get('/:id/status', async (req, res) => {
  const document = await service.get(req.user!.id, req.params.id);
  if (!document) { res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' } }); return; }
  res.json({ id: document.id, status: document.status, chunkCount: document.chunkCount, processingError: document.processingError });
});
router.get('/:id', async (req, res) => {
  const document = await service.get(req.user!.id, req.params.id);
  if (!document) { res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' } }); return; }
  res.json({ document });
});
router.delete('/:id', async (req, res) => {
  try { await service.remove(req.user!.id, req.params.id); res.status(204).send(); }
  catch { res.status(404).json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' } }); }
});

export default router;
