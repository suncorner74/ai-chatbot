/**
 * Backend Integration Tests — POST /api/chat
 *
 * WHAT THESE TESTS DO:
 * - Use supertest to make real HTTP requests to the Express app
 * - Mock the OpenAI provider so no real API calls are made
 * - Mock the env config so no real .env file is needed
 *
 * WHY MOCK THE LLM?
 * Real LLM API calls are:
 * - Slow (adds seconds to test runs)
 * - Flaky (network can fail, API can be down)
 * - Expensive (charged per token)
 * Tests should be fast, reliable, and free.
 *
 * jest.mock() IS HOISTED:
 * Jest automatically moves jest.mock() calls to the TOP of the file,
 * before any imports. This ensures mocks are set up before the modules load.
 *
 * The 'mock' prefix on mockGenerateResponse is required —
 * Jest allows variables starting with 'mock' to be referenced
 * inside jest.mock() factory functions despite hoisting.
 */

// ── Mocks (hoisted by Jest before imports) ────────────────────────

const mockGenerateResponse = jest.fn();

jest.mock('../ai/llm/providers/openai.provider', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => ({
    generateResponse: mockGenerateResponse,
  })),
}));

jest.mock('../config/env', () => ({
  env: {
    port: 5000,
    llmApiKey: 'test-api-key',
    llmModel: 'gpt-4o-mini',
    nodeEnv: 'test',
  },
}));

// ── Imports ───────────────────────────────────────────────────────

import request from 'supertest';
import app from '../app';

// ── Tests ─────────────────────────────────────────────────────────

describe('POST /api/chat', () => {
  beforeEach(() => {
    // Default: LLM succeeds with a mocked response
    mockGenerateResponse.mockResolvedValue('Mocked AI response');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ── Success cases ───────────────────────────────────────────────

  it('returns 200 with a message for a valid request', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is React?' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
    expect(typeof res.body.message).toBe('string');
    expect(res.body.message).toBe('Mocked AI response');
  });

  it('trims whitespace from the message before processing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '  What is React?  ' });

    expect(res.status).toBe(200);
    expect(mockGenerateResponse).toHaveBeenCalledTimes(1);
  });

  // ── Validation errors (400) ─────────────────────────────────────

  it('returns 400 when message is an empty string', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 when message is only whitespace', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 when message field is missing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 when message is not a string', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 123 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  it('returns 400 when message exceeds max length', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'a'.repeat(4001) });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
  });

  // ── LLM failure (500) ───────────────────────────────────────────

  it('returns 500 when the LLM provider throws an error', async () => {
    mockGenerateResponse.mockRejectedValueOnce(
      new Error('OpenAI API is unavailable')
    );

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is React?' });

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('LLM_REQUEST_FAILED');
    // The real error message must NOT be exposed to the client
    expect(res.body.error.message).not.toContain('OpenAI API is unavailable');
  });
});

// ── Health Check ────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
