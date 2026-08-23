/** Frontend chat types. */
export type MessageRole = 'user' | 'assistant';
export interface ChatSource { chunkId: string; documentId: string; documentName: string; page?: number | null; section?: string | null; score: number }
export interface ChatMessage { id: string; role: MessageRole; content: string; sources?: ChatSource[] }
export interface ApiError { code: string; message: string }
