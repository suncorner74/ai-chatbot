import app from './app';
import { env } from './config/env';

/**
 * server.ts — starts the HTTP server.
 *
 * WHY IS THIS SEPARATE FROM app.ts?
 * app.ts configures the Express application (routes, middleware).
 * server.ts binds that app to a network port.
 *
 * Separating them means tests can import app.ts without starting
 * a real server that occupies a port. supertest handles its own
 * test server internally.
 */
app.listen(env.port, () => {
  console.log(`\n🚀 API server running at http://localhost:${env.port}`);
  console.log(`   Environment : ${env.nodeEnv}`);
  console.log(`   LLM Model   : ${env.llmModel}`);
  console.log(`   Health check: http://localhost:${env.port}/health\n`);
});
