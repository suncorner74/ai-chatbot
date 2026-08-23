import { prisma } from '../../config/prisma';
import { GeminiRagProvider } from './gemini-rag.provider';
import { cosineSimilarity, keywordScore } from './rag.utils';
import { RetrievedChunk, RetrievalFilters } from './rag.types';

export class Retriever {
  constructor(private readonly gemini = new GeminiRagProvider()) {}

  async retrieve(query: string, filters: RetrievalFilters, limit = 8): Promise<{ chunks: RetrievedChunk[]; candidateCount: number; latencyMs: number }> {
    const started = performance.now();
    const docs = await prisma.document.findMany({
      where: {
        userId: filters.userId,
        status: 'READY',
        ...(filters.documentId ? { id: filters.documentId } : {}),
        ...(filters.documentType ? { mimeType: filters.documentType } : {}),
        ...(filters.knowledgeBaseId ? { knowledgeBases: { some: { knowledgeBaseId: filters.knowledgeBaseId } } } : {}),
        ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
      },
      select: { id: true, name: true, chunks: { where: { parentId: { not: null } }, select: { id: true, parentId: true, page: true, section: true, content: true, context: true, embedding: true, metadata: true } } },
    });

    const queryVector = await this.gemini.embed(query);
    const candidates: RetrievedChunk[] = [];
    for (const document of docs) {
      for (const chunk of document.chunks) {
        const vector = chunk.embedding ? JSON.parse(chunk.embedding) as number[] : [];
        const vectorScore = cosineSimilarity(queryVector, vector);
        const keyword = keywordScore(query, `${chunk.context || ''}\n${chunk.content}`);
        const score = (0.72 * vectorScore) + (0.28 * keyword);
        if (score <= 0.05) continue;
        candidates.push({ chunkId: chunk.id, documentId: document.id, documentName: document.name, page: chunk.page, section: chunk.section, content: chunk.content, context: chunk.context, score, vectorScore, keywordScore: keyword });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    const fused = candidates.slice(0, 30);
    const reranked = fused.map((chunk) => ({ ...chunk, rerankScore: (0.7 * (chunk.vectorScore || 0)) + (0.2 * (chunk.keywordScore || 0)) + (0.1 * Math.min(1, (chunk.content.length / 1200))) }));
    reranked.sort((a, b) => (b.rerankScore || 0) - (a.rerankScore || 0));

    const selected = reranked.slice(0, limit);
    const parentIds = [...new Set((await Promise.all(selected.map(async (chunk) => {
      const row = await prisma.documentChunk.findUnique({ where: { id: chunk.chunkId }, select: { parentId: true } });
      return row?.parentId;
    }))).filter((id): id is string => Boolean(id)))];
    const parents = await prisma.documentChunk.findMany({ where: { id: { in: parentIds } }, select: { id: true, content: true } });
    const parentMap = new Map(parents.map((parent) => [parent.id, parent.content]));
    for (const chunk of selected) {
      const row = await prisma.documentChunk.findUnique({ where: { id: chunk.chunkId }, select: { parentId: true } });
      chunk.parentContent = row?.parentId ? parentMap.get(row.parentId) || null : null;
    }

    return { chunks: selected, candidateCount: candidates.length, latencyMs: Math.round(performance.now() - started) };
  }
}
