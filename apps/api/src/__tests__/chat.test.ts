const mockStreamChat = jest.fn();
let mockAuthenticated = true;

jest.mock('../middleware/auth', () => ({
  requireAuth: (req: { user?: { id: string } }, res: { status: (code: number) => { json: (body: unknown) => void } }, next: () => void) => {
    if (!mockAuthenticated) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
      return;
    }
    req.user = { id: 'user-1' };
    next();
  },
}));

jest.mock('../middleware/rate-limit', () => ({
  createRateLimiter: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock('../middleware/usage-limit', () => ({
  enforceDailyChatLimit: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

jest.mock('../modules/chat/chat.service', () => ({
  ChatService: jest.fn().mockImplementation(() => ({ streamChat: mockStreamChat })),
}));

jest.mock('../ai/llm/providers/openrouter.provider', () => ({
  OpenRouterProvider: jest.fn().mockImplementation(() => ({ streamResponse: jest.fn() })),
}));

jest.mock('../config/env', () => ({
  env: {
    port: 5000,
    frontendUrl: 'http://localhost:5173',
    nodeEnv: 'test',
    llmApiKey: 'test-api-key',
    llmModel: 'test-model',
  },
}));

import request from 'supertest';
import app from '../app';

describe('POST /api/chat streaming', () => {
  beforeEach(() => {
    mockAuthenticated = true;
    mockStreamChat.mockReset();
    mockStreamChat.mockResolvedValue({
      conversationId: 'conversation-1',
      tokens: (async function* () {
        yield 'Hello';
        yield ' world';
      })(),
    });
  });

  it('rejects unauthenticated requests with 401', async () => {
    mockAuthenticated = false;
    const res = await request(app).post('/api/chat').send({ message: 'hello' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  it('streams token, done events and conversation metadata', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'hello' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('event: token');
    expect(res.text).toContain('"token":"Hello"');
    expect(res.text).toContain('"token":" world"');
    expect(res.text).toContain('event: done');
    expect(res.text).toContain('"conversationId":"conversation-1"');
  });

  it('validates the request before starting generation', async () => {
    const res = await request(app).post('/api/chat').send({ message: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_REQUEST');
    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  it('returns a safe 404 when conversation ownership validation fails', async () => {
    mockStreamChat.mockRejectedValueOnce(new Error('CONVERSATION_NOT_FOUND'));
    const res = await request(app).post('/api/chat').send({ message: 'hello', conversationId: 'other-user-conversation' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('sends a safe stream error when generation fails after streaming starts', async () => {
    mockStreamChat.mockResolvedValueOnce({
      conversationId: 'conversation-1',
      tokens: (async function* () {
        yield 'partial';
        throw new Error('provider secret details');
      })(),
    });

    const res = await request(app).post('/api/chat').send({ message: 'hello' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('event: error');
    expect(res.text).toContain('Unable to generate a response. Please try again.');
    expect(res.text).not.toContain('provider secret details');
  });
});

describe('GET /health', () => {
  it('returns 200 with ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
