import { clearSessionCookie, setSessionCookie } from '../modules/auth/auth.cookie';
import { env } from '../config/env';

describe('session cookies', () => {
  it('sets HttpOnly and SameSite cookie attributes', () => {
    const response = { setHeader: jest.fn() } as any;
    setSessionCookie(response, 'session-id');
    const value = response.setHeader.mock.calls[0][1] as string;
    expect(value).toContain(`${env.sessionCookieName}=session-id`);
    expect(value).toContain('HttpOnly');
    expect(value).toContain('SameSite=Lax');
    expect(value).toContain('Path=/');
  });

  it('clears the session cookie', () => {
    const response = { setHeader: jest.fn() } as any;
    clearSessionCookie(response);
    const value = response.setHeader.mock.calls[0][1] as string;
    expect(value).toContain('Max-Age=0');
  });
});
