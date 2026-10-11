import 'reflect-metadata';
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
  beforeAll(async () => {
    const auth = betterAuth({
      ...getAuthOptions(config),
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
    const originService = new AuthService({} as PrismaService, config);
    const module = await Test.createTestingModule({
      imports: [AuthModule],
      controllers: [TestController],
    })
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
});
