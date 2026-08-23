import { LLMProvider, LLMMessage } from '../../ai/llm/interfaces/llm-provider.interface';
import { CHATBOT_SYSTEM_PROMPT } from '../../ai/prompts/chatbot.system';
import { ChatRepository } from './chat.repository';
import { RagService } from '../rag/rag.service';
import { SourceCitation } from '../rag/rag.types';
export type ChatGenerationMode = 'new' | 'retry' | 'regenerate';
export interface RagOptions { enabled?: boolean; documentId?: string; knowledgeBaseId?: string; }
export interface ChatStreamResult { conversationId: string; tokens: AsyncIterable<string>; citations: SourceCitation[]; }
export class ChatService {
  constructor(private readonly llmProvider: LLMProvider, private readonly repository = new ChatRepository(), private readonly ragService = new RagService()) {}
  async chat(userId: string, conversationId: string | undefined, userMessage: string, ragOptions: RagOptions = {}) {
    const conversation = await this.resolveConversation(userId, conversationId, userMessage);
    const rag = ragOptions.enabled || ragOptions.documentId || ragOptions.knowledgeBaseId ? await this.ragService.retrieve(userId, userMessage, { conversationId: conversation.id, ...ragOptions }) : null;
    const messages = await this.buildMessages(conversation.id, userMessage, 'new', rag?.evidence); await this.repository.createUserMessage(conversation.id, userMessage);
    const response = rag && !rag.hasEvidence ? RagService.noEvidenceMessage() : await this.llmProvider.generateResponse(messages);
    await this.repository.createAssistantMessage(conversation.id, response); return { message: response, conversationId: conversation.id, citations: rag?.citations || [] };
  }
  async streamChat(userId: string, conversationId: string | undefined, userMessage: string, signal?: AbortSignal, mode: ChatGenerationMode = 'new', ragOptions: RagOptions = {}): Promise<ChatStreamResult> {
    const conversation = await this.resolveConversation(userId, conversationId, userMessage); const history = await this.repository.getHistory(conversation.id); const lastHistoryMessage = history.length > 0 ? history[history.length - 1] : undefined; const effectiveMode = mode === 'new' && lastHistoryMessage?.role === 'user' && lastHistoryMessage.content === userMessage ? 'retry' : mode;
    const rag = ragOptions.enabled || ragOptions.documentId || ragOptions.knowledgeBaseId ? await this.ragService.retrieve(userId, userMessage, { conversationId: conversation.id, history, ...ragOptions }) : null;
    const messages = await this.buildMessages(conversation.id, userMessage, effectiveMode, rag?.evidence); if (effectiveMode === 'new') await this.repository.createUserMessage(conversation.id, userMessage);
    const conversationIdValue = conversation.id; const repository = this.repository;
    if (rag && !rag.hasEvidence) { const exact = RagService.noEvidenceMessage(); async function* noEvidenceTokens() { yield exact; await repository.createAssistantMessageIfMissing(conversationIdValue, exact); } return { conversationId: conversationIdValue, tokens: noEvidenceTokens(), citations: [] }; }
    const llmStream = this.llmProvider.streamResponse(messages, { signal }); const startedAt = performance.now();
    async function* tokens(): AsyncIterable<string> { let response = ''; try { for await (const token of llmStream) { if (signal?.aborted) throw new DOMException('Generation aborted', 'AbortError'); response += token; yield token; } if (!response) throw new Error('LLM_EMPTY_RESPONSE'); await repository.createAssistantMessageIfMissing(conversationIdValue, response); } finally {} }
    return { conversationId: conversationIdValue, tokens: tokens(), citations: rag?.citations || [] };
  }
  private async resolveConversation(userId: string, conversationId: string | undefined, userMessage: string) { if (conversationId) { const conversation = await this.repository.findConversationForUser(conversationId, userId); if (!conversation) throw new Error('CONVERSATION_NOT_FOUND'); return conversation; } return this.repository.createConversation(userId, userMessage); }
  private async buildMessages(conversationId: string, userMessage: string, mode: ChatGenerationMode = 'new', ragEvidence?: string): Promise<LLMMessage[]> { let history = await this.repository.getHistory(conversationId); if (mode === 'regenerate') { const lastAssistantIndex = [...history].map((message) => message.role).lastIndexOf('assistant'); if (lastAssistantIndex >= 0) history = history.slice(0, lastAssistantIndex); } const ragInstruction = ragEvidence ? '\n\nYou are answering using private document evidence. Treat the evidence below as the source of truth. Cite claims with [1], [2], etc. only when the corresponding evidence exists. If the evidence does not support the answer, say you could not find it in the uploaded documents.\n\nDOCUMENT EVIDENCE:\n' + ragEvidence : ''; return [{ role: 'system', content: CHATBOT_SYSTEM_PROMPT + ragInstruction }, ...history.map((message) => ({ role: message.role as LLMMessage['role'], content: message.content })), ...(mode === 'new' ? [{ role: 'user' as const, content: userMessage }] : [])]; }
}
