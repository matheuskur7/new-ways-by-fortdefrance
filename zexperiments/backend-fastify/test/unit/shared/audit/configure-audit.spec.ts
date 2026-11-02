import 'reflect-metadata';
import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Express, Request } from 'express';
import request from 'supertest';
import { configureAudit } from '../../../../src/shared/audit/configure-audit.js';
import { getAuditActor } from '../../../../src/shared/audit/audit-context.js';
import type { AuthSession } from '../../../../src/modules/auth/auth.config.js';
import { AuthGuard } from '../../../../src/modules/auth/auth.guard.js';
import { AuthService } from '../../../../src/modules/auth/auth.service.js';

@Controller('audit-test')
class AuditController {
  @Post('protected')
  @UseGuards(AuthGuard)
  protectedContext() {
    return { actor: getAuditActor() };
  }

  @Post()
  async context(@Body() _body: unknown, @Req() _request: Request) {
    await Promise.resolve();
    return { actor: getAuditActor() };
  }
}

describe('Audit request boundary (mocked session, no database)', () => {
  let app: NestExpressApplication;
  const getSession = vi.fn(async (headers: { cookie?: string }) => {
    await Promise.resolve();
    if (headers.cookie === 'broken') throw new Error('session unavailable');
    const id =
      headers.cookie === 'session=alice'
        ? 'alice'
        : headers.cookie === 'session=bob'
          ? 'bob'
          : null;
    return id ? ({ user: { id } } as AuthSession) : null;
  });
  const assertTrustedOrigin = vi.fn((headers: { origin?: string }) => {
    if (headers.origin !== 'http://frontend.test')
      throw new ForbiddenException();
  });
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: { getSession, assertTrustedOrigin } },
      ],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>({
      bodyParser: false,
      logger: false,
    });
    configureAudit(app, { getSession });
    // Mirrors the raw Better Auth registration order, ahead of Nest parsers/routes.
    const expressApp: Express = app.getHttpAdapter().getInstance();
    expressApp.all('/api/auth/test-audit', (_request, response) =>
      response.json({ actor: getAuditActor() }),
    );
    app.useBodyParser('json');
    await app.init();
  });
  afterAll(async () => app?.close());
  beforeEach(() => vi.clearAllMocks());

  it('validates the session only once across the middleware and guard while preserving origin checks', async () => {
    const response = await request(app.getHttpServer())
      .post('/audit-test/protected')
      .set('Cookie', 'session=alice')
      .set('Origin', 'http://frontend.test')
      .send({})
      .expect(201);
    expect(response.body.actor).toBe('alice');
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(assertTrustedOrigin).toHaveBeenCalledTimes(1);
  });

  it('reuses an invalid-session result without allowing access or borrowing another request session', async () => {
    await request(app.getHttpServer())
      .post('/audit-test/protected')
      .set('Cookie', 'expired')
      .set('Origin', 'http://frontend.test')
      .send({})
      .expect(401);
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(assertTrustedOrigin).not.toHaveBeenCalled();
  });

  it('still rejects an untrusted origin when the guard reuses a validated session', async () => {
    await request(app.getHttpServer())
      .post('/audit-test/protected')
      .set('Cookie', 'session=alice')
      .set('Origin', 'http://attacker.test')
      .send({})
      .expect(403);
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(assertTrustedOrigin).toHaveBeenCalledTimes(1);
  });

  it('takes identity from the validated session for both raw auth and Nest handlers', async () => {
    for (const path of ['/audit-test', '/api/auth/test-audit']) {
      const response = await request(app.getHttpServer())
        .post(path)
        .set('Cookie', 'session=alice')
        .set('X-User-Id', 'mallory')
        .send({ createdBy: 'mallory', updatedBy: 'mallory' })
        .expect(path === '/audit-test' ? 201 : 200);
      expect(response.body).toEqual({ actor: 'alice' });
    }
  });

  it('keeps session identity available for auth callbacks that write on GET', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/auth/test-audit')
      .set('Cookie', 'session=alice')
      .expect(200);
    expect(response.body.actor).toBe('alice');
  });

  it('does not borrow an actor from an earlier or simultaneous request', async () => {
    const responses = await Promise.all(
      ['alice', 'bob'].map((actor) =>
        request(app.getHttpServer())
          .post('/audit-test')
          .set('Cookie', `session=${actor}`)
          .send({}),
      ),
    );
    expect(responses.map((response) => response.body.actor)).toEqual([
      'alice',
      'bob',
    ]);
    const anonymous = await request(app.getHttpServer())
      .post('/audit-test')
      .set('Cookie', 'expired')
      .send({ userId: 'alice' })
      .expect(201);
    expect(anonymous.body.actor).toBeNull();
    expect(getAuditActor()).toBeNull();
  });

  it('does not continue into a writer when session validation fails', async () => {
    await request(app.getHttpServer())
      .post('/audit-test')
      .set('Cookie', 'broken')
      .send({})
      .expect(500);
  });
});
