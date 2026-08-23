import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { DocumentProcessor } from './document.processor';
import { sha256 } from './rag.utils';

const MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export class DocumentService {
  constructor(private readonly processor = new DocumentProcessor()) {}

  validate(name: string, mimeType: string, size: number) {
    if (!MIME_TYPES.has(mimeType)) throw new Error('UNSUPPORTED_DOCUMENT_TYPE');
    if (!size || size > env.maxDocumentSizeBytes) throw new Error('DOCUMENT_TOO_LARGE');
    if (!name || name.length > 255) throw new Error('INVALID_DOCUMENT_NAME');
  }

  async create(userId: string, name: string, mimeType: string, buffer: Buffer, knowledgeBaseId?: string) {
    this.validate(name, mimeType, buffer.length);
    const fileHash = sha256(buffer);
    const existing = await prisma.document.findFirst({ where: { userId, fileHash }, select: { id: true, name: true, status: true } });
    if (existing) return { duplicate: true, document: existing };

    if (knowledgeBaseId) {
      const kb = await prisma.knowledgeBase.findFirst({ where: { id: knowledgeBaseId, userId }, select: { id: true } });
      if (!kb) throw new Error('KNOWLEDGE_BASE_NOT_FOUND');
    }

    const document = await prisma.document.create({
      data: { userId, name, mimeType, sizeBytes: buffer.length, fileHash, contentHash: fileHash, status: 'UPLOADING' },
      select: { id: true, name: true, mimeType: true, sizeBytes: true, status: true, createdAt: true, chunkCount: true },
    });
    if (knowledgeBaseId) await prisma.knowledgeBaseDocument.create({ data: { knowledgeBaseId, documentId: document.id } });

    await prisma.document.update({ where: { id: document.id }, data: { status: 'PROCESSING' } });
    void this.processor.process(document.id, buffer);
    return { duplicate: false, document: { ...document, status: 'PROCESSING' as const } };
  }

  list(userId: string) {
    return prisma.document.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, mimeType: true, sizeBytes: true, status: true, processingError: true, chunkCount: true, documentVersion: true, createdAt: true, updatedAt: true } });
  }

  get(userId: string, id: string) {
    return prisma.document.findFirst({ where: { id, userId }, select: { id: true, name: true, mimeType: true, sizeBytes: true, status: true, processingError: true, chunkCount: true, documentVersion: true, createdAt: true, updatedAt: true, processedAt: true } });
  }

  async remove(userId: string, id: string) {
    const result = await prisma.document.deleteMany({ where: { id, userId } });
    if (!result.count) throw new Error('DOCUMENT_NOT_FOUND');
  }

  async createKnowledgeBase(userId: string, name: string, description?: string) {
    return prisma.knowledgeBase.create({ data: { userId, name: name.trim(), description: description?.trim() || null }, select: { id: true, name: true, description: true, createdAt: true, updatedAt: true } });
  }

  listKnowledgeBases(userId: string) {
    return prisma.knowledgeBase.findMany({ where: { userId }, orderBy: { name: 'asc' }, include: { _count: { select: { documents: true } } } });
  }

  getKnowledgeBase(userId: string, id: string) {
    return prisma.knowledgeBase.findFirst({ where: { id, userId }, include: { documents: { include: { document: { select: { id: true, name: true, status: true, chunkCount: true } } } } } });
  }

  async removeKnowledgeBase(userId: string, id: string) {
    const result = await prisma.knowledgeBase.deleteMany({ where: { id, userId } });
    if (!result.count) throw new Error('KNOWLEDGE_BASE_NOT_FOUND');
  }
}
