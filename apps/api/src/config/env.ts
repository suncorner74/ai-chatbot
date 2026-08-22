import path from 'path';
import dotenv from 'dotenv';

/**
 * Load environment variables from the .env file at the monorepo root.
 *
 * WHY USE __dirname INSTEAD OF process.cwd()?
 * __dirname is always the directory where THIS file lives, regardless of where
 * you run the server from. process.cwd() changes depending on the terminal's
 * working directory — making it unreliable.
 *
 * Path: apps/api/src/config/ → up 4 levels → monorepo root
 */
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

/**
 * Throws immediately if a required environment variable is missing.
 *
 * WHY FAIL FAST?
 * If the server starts without an API key, it will appear to work but
 * crash on the first real request. Failing at startup gives a clear,
 * immediate error message instead of a confusing runtime failure.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[Config] Missing required environment variable: ${name}\n` +
        `  → Copy .env.example to .env and fill in your values.`
    );
  }
  return value;
}

/**
 * All environment configuration in one place.
 *
 * WHY A CENTRAL CONFIG MODULE?
 * If PORT is referenced in 5 files, changing its env var name means
 * updating 5 files. With this module, you change it once here.
 */
export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: requireEnv('DATABASE_URL'),
  llmApiKey: requireEnv('LLM_API_KEY'),
  llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',
} as const;
