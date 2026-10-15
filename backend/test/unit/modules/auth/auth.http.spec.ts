import 'reflect-metadata';
import type { EmailService } from '../../../../src/shared/email/email.service.js';
import { StorageService } from '../../../../src/shared/storage/storage.service.js';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { fromNodeHeaders } from 'better-auth/node';
import request from 'supertest';
import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';
import { ImageTagDto } from '../../../../src/modules/image/dto/image-tag.dto.js';
import { AuthModule } from '../../../../src/modules/auth/auth.module.js';
import { AuthService } from '../../../../src/modules/auth/auth.service.js';
import { Public } from '../../../../src/modules/auth/public.decorator.js';
import { getAuthOptions } from '../../../../src/modules/auth/auth.config.js';
import { configureAuth } from '../../../../src/modules/auth/configure-auth.js';
import { configureApplication } from '../../../../src/shared/http/configure-application.js';

@Controller('test-auth')
class TestController {
  @Get('private') privateRoute() {
    return { protected: true };
  }
  @Post('private')
  mutate(@Body() dto: ImageTagDto) {
    return { tag: dto.tag };
  }

  @Public() @Get('public') publicRoute() {
    return { public: true };
  }
}

const frontend = 'http://localhost:3000';
const config = new ConfigService({
  BETTER_AUTH_SECRET: 'test-secret-with-more-than-32-characters',
  BETTER_AUTH_URL: 'http://localhost:5000',
  FRONTEND_URL: frontend,
});

describe('Better Auth HTTP integration (in-memory database)', () => {
  let app: NestExpressApplication;
  let agent: ReturnType<typeof request.agent>;
  let organizationId: string;
  const messages: { kind: string; to: string; url: string }[] = [];
  const email = {
    sendAuthenticationEmail: vi.fn((kind: string, to: string, url: string) => {
      messages.push({ kind, to, url });
    }),
  };
  async function verifyAccount(emailAddress: string) {
    const message = messages.findLast(
      (message) =>
        message.kind === 'verification' && message.to === emailAddress,
    );
    expect(message).toBeDefined();
    const url = new URL(message!.url);
    await request(app.getHttpServer())
      .get(url.pathname + url.search)
      .expect(302);
  }
  async function loginAccount(
    client: ReturnType<typeof request.agent>,
    emailAddress: string,
  ) {
    await client
      .post('/api/auth/sign-in/email')
      .set('Origin', frontend)
      .send({ email: emailAddress, password: 'Strong-password-123' })
      .expect(200);
  }
  beforeAll(async () => {
    const auth = betterAuth({
      ...getAuthOptions(config, email),
      database: memoryAdapter({
        user: [],
        session: [],
        account: [],
        verification: [],
        organization: [],
        member: [],
        invitation: [],
      }),
      rateLimit: { enabled: false },
    });
    const originService = new AuthService(
      {} as PrismaService,
      config,
      {} as StorageService,
      email as unknown as EmailService,
    );
    const module = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [TestController],
    })
      .overrideProvider(StorageService)
      .useValue({})
      .overrideProvider(AuthService)
      .useValue({
        auth,
        assertTrustedOrigin:
          originService.assertTrustedOrigin.bind(originService),
        getSession: (headers: Parameters<typeof fromNodeHeaders>[0]) =>
          auth.api.getSession({ headers: fromNodeHeaders(headers) }),
      })
      .compile();
    app = module.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureAuth(app, auth, frontend);
    configureApplication(app);
    await app.init();
    agent = request.agent(app.getHttpServer());
  });
  afterAll(async () => app?.close());

  it('allows explicitly public Nest routes and rejects anonymous private routes', async () => {
    await request(app.getHttpServer()).get('/test-auth/public').expect(200);
    await request(app.getHttpServer()).get('/test-auth/private').expect(401);
  });
  it('registers an account through the raw Better Auth handler and authenticates the session', async () => {
    await agent
      .post('/api/auth/sign-up/email')
      .set('Origin', frontend)
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Strong-password-123',
      })
      .expect(200);
    await agent.get('/test-auth/private').expect(401);
    await agent
      .post('/api/auth/sign-in/email')
      .set('Origin', frontend)
      .send({ email: 'test@example.com', password: 'Strong-password-123' })
      .expect(403);
    await verifyAccount('test@example.com');
    await loginAccount(agent, 'test@example.com');
    await agent.get('/test-auth/private').expect(200);
  });
  it('protects Nest mutations and preserves DTO validation after mounting the raw auth handler', async () => {
    await agent
      .post('/test-auth/private')
      .send({ tag: 'car-image' })
      .expect(403);
    await agent
      .post('/test-auth/private')
      .set('Origin', frontend)
      .send({ tag: 'unknown' })
      .expect(400);
    await agent
      .post('/test-auth/private')
      .set('Origin', frontend)
      .send({ tag: 'car-image' })
      .expect(201)
      .expect({ tag: 'car-image' });
  });
  it('rejects requests from an untrusted origin', async () => {
    await agent
      .post('/api/auth/organization/create')
      .set('Origin', 'https://untrusted.example')
      .send({ name: 'Bad', slug: 'bad' })
      .expect(403);
  });
  it('creates an organization and gives its creator the owner role', async () => {
    const result = await agent
      .post('/api/auth/organization/create')
      .set('Origin', frontend)
      .send({ name: 'Test Org', slug: 'test-org' })
      .expect(200);
    organizationId = result.body.id;
    expect(result.body.members[0].role).toBe('owner');
    const organizations = await agent
      .get('/api/auth/organization/list')
      .expect(200);
    expect(organizations.body.map((org: { id: string }) => org.id)).toContain(
      organizationId,
    );
  });
  it('selects an organization and stores it on the session', async () => {
    await agent
      .post('/api/auth/organization/set-active')
      .set('Origin', frontend)
      .send({ organizationId })
      .expect(200);
    const session = await agent.get('/api/auth/get-session').expect(200);
    expect(session.body.session.activeOrganizationId).toBe(organizationId);
  });
  it('blocks organization selection by a user who is not a member', async () => {
    const outsider = request.agent(app.getHttpServer());
    await outsider
      .post('/api/auth/sign-up/email')
      .set('Origin', frontend)
      .send({
        name: 'Other',
        email: 'other@example.com',
        password: 'Strong-password-123',
      })
      .expect(200);
    await verifyAccount('other@example.com');
    await loginAccount(outsider, 'other@example.com');
    await outsider
      .post('/api/auth/organization/set-active')
      .set('Origin', frontend)
      .send({ organizationId })
      .expect(403);
  });
  it('expires after 12 hours and only renews after each 3-hour interval', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', frontend)
      .send({ email: 'test@example.com', password: 'Strong-password-123' })
      .expect(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    const initial = await request(app.getHttpServer())
      .get('/api/auth/get-session')
      .set('Cookie', cookie)
      .expect(200);
    const createdAt = new Date(initial.body.session.createdAt).getTime();
    const expiresAt = new Date(initial.body.session.expiresAt).getTime();
    const hour = 60 * 60 * 1000;
    expect(expiresAt - createdAt).toBe(12 * hour);
    expect(login.headers['set-cookie'][0]).toContain('Max-Age=43200');

    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(createdAt + 3 * hour - 1000);
      const before = await request(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', cookie)
        .expect(200);
      expect(new Date(before.body.session.expiresAt).getTime()).toBe(expiresAt);

      const renewalTime = createdAt + 3 * hour + 1000;
      vi.setSystemTime(renewalTime);
      const renewed = await request(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', cookie)
        .expect(200);
      const renewedExpiry = new Date(renewed.body.session.expiresAt).getTime();
      expect(renewedExpiry).toBe(renewalTime + 12 * hour);
      expect(renewed.headers['set-cookie'][0]).toContain('Max-Age=43200');

      vi.setSystemTime(renewalTime + 3 * hour - 1000);
      const unchanged = await request(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', cookie)
        .expect(200);
      expect(new Date(unchanged.body.session.expiresAt).getTime()).toBe(
        renewedExpiry,
      );

      vi.setSystemTime(renewalTime + 3 * hour);
      const nextRenewal = await request(app.getHttpServer())
        .get('/api/auth/get-session')
        .set('Cookie', cookie)
        .expect(200);
      expect(new Date(nextRenewal.body.session.expiresAt).getTime()).toBe(
        renewalTime + 15 * hour,
      );

      vi.setSystemTime(renewalTime + 15 * hour + 1000);
      await request(app.getHttpServer())
        .get('/test-auth/private')
        .set('Cookie', cookie)
        .expect(401);
    } finally {
      vi.useRealTimers();
    }
  });
  it('invalidates the session on logout and rejects reuse of the old cookie', async () => {
    const loginSession = await agent.get('/api/auth/get-session').expect(200);
    expect(loginSession.body.user.email).toBe('test@example.com');
    const login = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', frontend)
      .send({ email: 'test@example.com', password: 'Strong-password-123' })
      .expect(200);
    const cookie = login.headers['set-cookie'][0].split(';')[0];
    await request(app.getHttpServer())
      .post('/api/auth/sign-out')
      .set('Origin', frontend)
      .set('Cookie', cookie)
      .expect(200);
    await request(app.getHttpServer())
      .get('/test-auth/private')
      .set('Cookie', cookie)
      .expect(401);
  });
  it('resends verification with an indistinguishable response for unknown addresses', async () => {
    const before = messages.length;
    await request(app.getHttpServer())
      .post('/api/auth/send-verification-email')
      .set('Origin', frontend)
      .send({
        email: 'missing@example.com',
        callbackURL: `${frontend}/verify-email`,
      })
      .expect(200)
      .expect({ status: true });
    expect(messages).toHaveLength(before);
    await request(app.getHttpServer())
      .post(
        '/api/auth/verify-email?token=invalid&callbackURL=' +
          encodeURIComponent(`${frontend}/verify-email`),
      )
      .set('Origin', frontend)
      .expect(404);
    const invalid = await request(app.getHttpServer())
      .get(
        '/api/auth/verify-email?token=invalid&callbackURL=' +
          encodeURIComponent(`${frontend}/verify-email`),
      )
      .expect(302);
    expect(invalid.headers.location).toContain('error=');
  });

  it('resends a confirmation without trusting verification fields from the client', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-up/email')
      .set('Origin', frontend)
      .send({
        name: 'Pending',
        email: 'pending@example.com',
        password: 'Strong-password-123',
        emailVerified: true,
      })
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', frontend)
      .send({ email: 'pending@example.com', password: 'Strong-password-123' })
      .expect(403);
    const before = messages.length;
    await request(app.getHttpServer())
      .post('/api/auth/send-verification-email')
      .set('Origin', frontend)
      .send({
        email: 'pending@example.com',
        callbackURL: `${frontend}/verify-email?verified=1`,
      })
      .expect(200)
      .expect({ status: true });
    expect(messages).toHaveLength(before + 1);
    expect(messages.at(-1)).toMatchObject({
      kind: 'verification',
      to: 'pending@example.com',
    });
    await verifyAccount('pending@example.com');
    const session = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', frontend)
      .send({ email: 'pending@example.com', password: 'Strong-password-123' })
      .expect(200);
    expect(session.body.user.emailVerified).toBe(true);
  });

  it('resets a password once, rejects reuse and revokes all old sessions', async () => {
    const authenticated = request.agent(app.getHttpServer());
    await loginAccount(authenticated, 'test@example.com');
    const before = messages.length;
    await request(app.getHttpServer())
      .post('/api/auth/request-password-reset')
      .set('Origin', frontend)
      .send({
        email: 'test@example.com',
        redirectTo: `${frontend}/reset-password`,
      })
      .expect(200);
    const message = messages.at(-1)!;
    expect(message.kind).toBe('password-reset');
    expect(messages).toHaveLength(before + 1);
    const resetURL = new URL(message.url);
    const token = resetURL.pathname.split('/').at(-1)!;
    const redirect = await request(app.getHttpServer())
      .get(resetURL.pathname + resetURL.search)
      .expect(302);
    expect(redirect.headers.location).toBe(
      `${frontend}/reset-password?token=${token}`,
    );
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .set('Origin', frontend)
      .send({ token, newPassword: 'New-strong-password-123' })
      .expect(200);
    await authenticated.get('/test-auth/private').expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/reset-password')
      .set('Origin', frontend)
      .send({ token, newPassword: 'Other-strong-password-123' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', frontend)
      .send({ email: 'test@example.com', password: 'Strong-password-123' })
      .expect(401);
    await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', frontend)
      .send({ email: 'test@example.com', password: 'New-strong-password-123' })
      .expect(200);
    const sent = messages.length;
    await request(app.getHttpServer())
      .post('/api/auth/request-password-reset')
      .set('Origin', frontend)
      .send({
        email: 'missing@example.com',
        redirectTo: `${frontend}/reset-password`,
      })
      .expect(200);
    expect(messages).toHaveLength(sent);
  });

  it('rejects expired reset and verification links and untrusted redirect URLs', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/request-password-reset')
      .set('Origin', frontend)
      .send({
        email: 'other@example.com',
        redirectTo: 'https://untrusted.example/reset-password',
      })
      .expect(403);
    await request(app.getHttpServer())
      .post('/api/auth/request-password-reset')
      .set('Origin', frontend)
      .send({
        email: 'other@example.com',
        redirectTo: `${frontend}/reset-password`,
      })
      .expect(200);
    const resetURL = new URL(messages.at(-1)!.url);
    const token = resetURL.pathname.split('/').at(-1)!;
    const verification = new URL(
      messages.find((message) => message.to === 'other@example.com')!.url,
    );
    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      vi.setSystemTime(Date.now() + 3601_000);
      await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .set('Origin', frontend)
        .send({ token, newPassword: 'New-strong-password-123' })
        .expect(400);
      const result = await request(app.getHttpServer())
        .get(verification.pathname + verification.search)
        .expect(302);
      expect(result.headers.location).toContain('error=TOKEN_EXPIRED');
    } finally {
      vi.useRealTimers();
    }
  });
});
