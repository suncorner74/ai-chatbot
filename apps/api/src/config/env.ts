import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`[Config] Missing required environment variable: ${name}\n  → Copy .env.example to .env and fill in your values.`);
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  llmApiKey: requireEnv('LLM_API_KEY'),
  llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',
  databaseUrl: process.env.DATABASE_URL || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  sessionCookieName: process.env.SESSION_COOKIE_NAME || (process.env.NODE_ENV === 'production' ? '__Host-session' : 'session'),
  sessionTtlDays: parseInt(process.env.SESSION_TTL_DAYS || '7', 10),
  chatRateLimitPerMinute: parseInt(process.env.CHAT_RATE_LIMIT_PER_MINUTE || '30', 10),
  chatDailyRequestLimit: parseInt(process.env.CHAT_DAILY_REQUEST_LIMIT || '50', 10),
  maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH || '10000', 10),
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || '',
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
} as const;
