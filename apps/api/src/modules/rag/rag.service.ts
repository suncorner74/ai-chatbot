import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { GeminiRagProvider } from './gemini-rag.provider';
import { Retriever } from './retriever';
import { RagResult, RetrievalFilters } from './rag.types';
const NO_EVIDENCE = 'I couldn\'t find this information in your uploaded documents.';
export class RagService {
  constructor(private readonly provider = new GeminiRagProvider(), private readonly retriever = new Retriever(provider)) {}
  async retrieve(userId: string, question: string, options: { conversationId?: string; documentId?: string; knowledgeBaseId?: string; history?: Array<{ role: string; content: string }> } = {}): Promise<RagResult> {
    let history = options.history || [];
    if (options.conversationId && !history.length) { const conversation = await prisma.conversation.findFirst({ where: { id: options.conversationId, userId }, include: { messages: { orderBy: { createdAt: 'desc' }, take: 8 } } }); history = (conversation?.messages || []).reverse().map((message) => ({ role: message.role, content: message.content })); }
    const rewrittenQuery = await this.provider.rewriteQuery(question, history); const subQueries = await this.provider.decomposeQuery(rewrittenQuery); const filters: RetrievalFilters = { userId, documentId: options.documentId, knowledgeBaseId: options.knowledgeBaseId };
    const retrievalStarted = performance.now(); const all = await Promise.all(subQueries.slice(0, 6).map((query) => this.retriever.retrieve(query, filters, 8))); const retrievalLatencyMs = Math.round(performance.now() - retrievalStarted);
    const map = new Map<string, (typeof all)[number]['chunks'][number]>(); for (const result of all) for (const chunk of result.chunks) { const previous = map.get(chunk.chunkId); if (!previous || (chunk.rerankScore || 0) > (previous.rerankScore || 0)) map.set(chunk.chunkId, chunk); }
    const chunks = [...map.values()].sort((a, b) => (b.rerankScore || 0) - (a.rerankScore || 0)).slice(0, 8); const sufficient = chunks.length > 0 && (chunks[0].rerankScore || 0) >= 0.12;
    const citations = sufficient ? chunks.map((chunk) => ({ chunkId: chunk.chunkId, documentId: chunk.documentId, documentName: chunk.documentName, page: chunk.page, section: chunk.section, score: Number((chunk.rerankScore || 0).toFixed(4)) })) : [];
    const evidence = sufficient ? chunks.map((chunk, index) => `[${index + 1}] ${chunk.documentName}${chunk.page ? ` p.${chunk.page}` : ''}${chunk.section ? ` > ${chunk.section}` : ''}\n${chunk.parentContent || chunk.context || ''}\n${chunk.content}`).join('\n\n') : NO_EVIDENCE;
    const metrics = { retrievalLatencyMs, rerankLatencyMs: 0, candidateCount: all.reduce((sum, result) => sum + result.candidateCount, 0), selectedCount: chunks.length };
    void prisma.ragUsage.create({ data: { userId, retrievalCount: subQueries.length, retrievedChunkCount: chunks.length, retrievalLatencyMs, rerankingLatencyMs: 0, estimatedCostUsd: env.ragEstimatedCostUsd, grounded: sufficient, citationCount: citations.length } }).catch(() => undefined);
    return { query: question, rewrittenQuery, evidence, chunks, citations, hasEvidence: sufficient, metrics };
  }
  static noEvidenceMessage() { return NO_EVIDENCE; }
}
