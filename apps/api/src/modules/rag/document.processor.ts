import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { GeminiRagProvider } from './gemini-rag.provider';
import { sha256 } from './rag.utils';

type Section = { heading: string; content: string; page?: number };

const PLAIN_TYPES = new Set([
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
]);

function splitSections(text: string): Section[] {
  const lines = text.replace(/\r/g, '').split('\n');
  const sections: Section[] = [];
  let heading = 'Document';
  let buffer: string[] = [];
  let page: number | undefined;

  const flush = () => {
    const content = buffer.join('\n').trim();
    if (content) sections.push({ heading, content, page });
    buffer = [];
  };

  for (const line of lines) {
    const pageMatch = line.match(/^\s*(?:---\s*)?(?:page|p\.)\s+(\d+)\s*(?:---)?\s*$/i);
    if (pageMatch) { flush(); page = Number(pageMatch[1]); continue; }
    const headingMatch = line.match(/^\s*(#{1,6})\s+(.+?)\s*$/) || line.match(/^\s*([A-Z][A-Za-z0-9 /&'_-]{2,80})\s*$/);
    if (headingMatch && line.trim().length < 100) {
      flush();
      heading = (headingMatch[2] || headingMatch[1]).trim();
      continue;
    }
    buffer.push(line);
  }
  flush();
  return sections.length ? sections : [{ heading: 'Document', content: text.trim() }];
}

function childChunks(content: string, size = 1200, overlap = 180): string[] {
  const paragraphs = content.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if (!current) { current = paragraph; continue; }
    if ((current.length + paragraph.length + 2) <= size) current += `\n\n${paragraph}`;
    else {
      chunks.push(current);
      const tail = current.slice(Math.max(0, current.length - overlap));
      current = `${tail}\n\n${paragraph}`;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [content.slice(0, size)];
}

export class DocumentProcessor {
  constructor(private readonly gemini = new GeminiRagProvider()) {}

  async process(documentId: string, buffer: Buffer): Promise<void> {
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) return;
    await prisma.document.update({ where: { id: documentId }, data: { status: 'PROCESSING', processingError: null } });

    try {
      const text = PLAIN_TYPES.has(document.mimeType)
        ? buffer.toString('utf8')
        : await this.gemini.extractDocument(buffer, document.mimeType, document.name);
      if (!text.trim()) throw new Error('DOCUMENT_EMPTY');

      const sections = splitSections(text);
      let chunkIndex = 0;
      const parents: Array<{ id: string; section: string; content: string }> = [];
      await prisma.documentChunk.deleteMany({ where: { documentId } });

      for (const section of sections) {
        const parent = await prisma.documentChunk.create({
          data: {
            documentId,
            chunkIndex: chunkIndex++,
            page: section.page,
            section: section.heading,
            heading: section.heading,
            content: section.content,
            context: `${document.name} > ${section.heading}`,
            contentHash: sha256(section.content),
            metadata: JSON.stringify({ type: 'parent', documentType: document.mimeType }),
          },
        });
        parents.push({ id: parent.id, section: section.heading, content: section.content });
        for (const child of childChunks(section.content)) {
          const context = `${document.name} > ${section.heading}`;
          const embedding = await this.gemini.embed(`${context}\n${child}`);
          await prisma.documentChunk.create({
            data: {
              documentId,
              parentId: parent.id,
              chunkIndex: chunkIndex++,
              page: section.page,
              section: section.heading,
              heading: section.heading,
              content: child,
              context,
              contentHash: sha256(child),
              embedding: JSON.stringify(embedding),
              embeddingVersion: env.ragEmbeddingModel,
              metadata: JSON.stringify({ type: 'child', documentType: document.mimeType, hasTable: /\|.+\|/.test(child) }),
            },
          });
        }
      }

      await prisma.documentVersion.create({
        data: {
          documentId,
          version: document.documentVersion,
          contentHash: sha256(text),
          fileHash: document.fileHash,
          embeddingVersion: env.ragEmbeddingModel,
        },
      });
      await prisma.document.update({
        where: { id: documentId },
        data: { sourceContent: text, contentHash: sha256(text), chunkCount: chunkIndex, status: 'READY', processedAt: new Date(), processingError: null },
      });
    } catch (error) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED', processingError: error instanceof Error ? error.message.slice(0, 500) : 'PROCESSING_FAILED' },
      });
    }
  }
}
