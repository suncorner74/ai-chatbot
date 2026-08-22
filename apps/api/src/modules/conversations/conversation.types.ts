export const MAX_CONVERSATION_TITLE_LENGTH = 100;

export interface CreateConversationInput {
  title?: string;
  userId?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationDetails extends ConversationSummary {
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
  }>;
}
