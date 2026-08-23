import { GeminiProvider } from '../../ai/llm/providers/gemini.provider';
import { RagService } from './rag.service';
export type DocumentAction = 'summarize' | 'key-points' | 'faq' | 'extract' | 'compare';
export class DocumentActionService {
  constructor(private readonly rag = new RagService(), private readonly gemini = new GeminiProvider()) {}
  async execute(userId: string, documentId: string, action: DocumentAction, secondDocumentId?: string) {
    const prompts: Record<Exclude<DocumentAction, 'compare'>, string> = {
      summarize: 'Summarize this document using only the retrieved evidence. Keep important dates, numbers, clauses and exceptions.',
      'key-points': 'Extract the most important key points from this document using only retrieved evidence.',
      faq: 'Generate a concise FAQ from this document. Every answer must be supported by retrieved evidence.',
      extract: 'Extract the important structured facts from this document. Preserve exact values and state when evidence is missing.',
    };
    if (action !== 'compare') {
      const result = await this.rag.retrieve(userId, prompts[action], { documentId });
      if (!result.hasEvidence) return { answer: RagService.noEvidenceMessage(), citations: [] };
      const response = await this.gemini.generateResponse([{ role: 'system', content: 'Use only the supplied private document evidence. Do not invent facts. Cite evidence using [1], [2] where applicable.' }, { role: 'user', content: `${prompts[action]}\n\nEvidence:\n${result.evidence}` }]);
      return { answer: response, citations: result.citations };
    }
    if (!secondDocumentId || secondDocumentId === documentId) throw new Error('SECOND_DOCUMENT_REQUIRED');
    const [left, right] = await Promise.all([this.rag.retrieve(userId, 'Provide the most important content, values, clauses and dates from this document for comparison.', { documentId }), this.rag.retrieve(userId, 'Provide the most important content, values, clauses and dates from this document for comparison.', { documentId: secondDocumentId })]);
    if (!left.hasEvidence || !right.hasEvidence) return { answer: RagService.noEvidenceMessage(), citations: [...left.citations, ...right.citations] };
    const response = await this.gemini.generateResponse([{ role: 'system', content: 'Compare only the supplied private document evidence. Identify additions, removals and changed values/clauses. Never invent differences.' }, { role: 'user', content: `Compare Document A and Document B.\n\nDocument A evidence:\n${left.evidence}\n\nDocument B evidence:\n${right.evidence}` }]);
    return { answer: response, citations: [...left.citations, ...right.citations] };
  }
}
