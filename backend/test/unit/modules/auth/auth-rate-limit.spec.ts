import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { getAuthOptions } from '../../../../src/modules/auth/auth.config.js';

it('releases a blocked authentication request after one minute', async () => {
  const config = new ConfigService({
    BETTER_AUTH_SECRET: 'test-secret-with-more-than-32-characters',
    BETTER_AUTH_URL: 'http://localhost:5000',
    FRONTEND_URL: 'http://localhost:3000',
  });
  const auth = betterAuth({
    ...getAuthOptions(config, { sendAuthenticationEmail: vi.fn() }),
    database: memoryAdapter({ user: [], verification: [] }),
    logger: { disabled: true },
  });
  const request = () =>
    auth.handler(
      new Request('http://localhost:5000/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          origin: 'http://localhost:3000',
          'x-forwarded-for': '203.0.113.64',
        },
        body: JSON.stringify({ email: 'missing@example.com' }),
      }),
    );
  for (let attempt = 0; attempt < 3; attempt++)
    expect((await request()).status).toBe(200);
  expect((await request()).status).toBe(429);
  vi.useFakeTimers({ toFake: ['Date'] });
  try {
    const start = Date.now();
    vi.setSystemTime(start + 10_001);
    expect((await request()).status).toBe(429);
    vi.setSystemTime(start + 60_001);
    expect((await request()).status).toBe(200);
  } finally {
    vi.useRealTimers();
  }
});
