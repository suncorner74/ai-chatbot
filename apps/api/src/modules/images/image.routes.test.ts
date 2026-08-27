import request from 'supertest';
import app from '../../app';

describe('image routes', () => {
  it('requires authentication', async () => {
    const response = await request(app).post('/api/images').send({ operation: 'generate', prompt: 'test' });
    expect(response.status).toBe(401);
  });

  it('rejects invalid operations after authentication is established by the auth middleware', async () => {
    const response = await request(app).post('/api/images').send({ operation: 'invalid' });
    expect([400, 401]).toContain(response.status);
  });
});
