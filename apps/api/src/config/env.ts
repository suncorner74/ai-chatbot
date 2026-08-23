import path from 'path';
import dotenv from 'dotenv';

// Load root .env first, then apps/api/.env if it exists
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // LLM Provider
  llmApiKey: process.env.LLM_API_KEY || '',
  llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',

  // Gemini Provider
  geminiApiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  // RAG Configuration
  ragEmbeddingModel: process.env.RAG_EMBEDDING_MODEL || 'gemini-embedding-001',
  ragEmbeddingDimensions: parseInt(process.env.RAG_EMBEDDING_DIMENSIONS || '768', 10),
  ragEstimatedCostUsd: parseFloat(process.env.RAG_ESTIMATED_COST_USD || '0'),
  ragVectorWeight: parseFloat(process.env.RAG_VECTOR_WEIGHT || '0.72'),
  ragKeywordWeight: parseFloat(process.env.RAG_KEYWORD_WEIGHT || '0.28'),
  ragCandidateLimit: parseInt(process.env.RAG_CANDIDATE_LIMIT || '30', 10),
  ragTopK: parseInt(process.env.RAG_TOP_K || '8', 10),
  maxDocumentSizeBytes: parseInt(process.env.MAX_DOCUMENT_SIZE_BYTES || String(10 * 1024 * 1024), 10),

  // Database & Session Auth
  databaseUrl: process.env.DATABASE_URL || '',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
  sessionCookieName: process.env.SESSION_COOKIE_NAME || (process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'),
  sessionTtlDays: parseInt(process.env.SESSION_TTL_DAYS || '7', 10),

  // Limits
  chatRateLimitPerMinute: parseInt(process.env.CHAT_RATE_LIMIT_PER_MINUTE || '30', 10),
  chatDailyRequestLimit: parseInt(process.env.CHAT_DAILY_REQUEST_LIMIT || '50', 10),
  maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '10000', 10),

  // Redis / Upstash
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || '',
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
} as const;
