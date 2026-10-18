import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import type { MemoryDB } from 'better-auth/adapters/memory';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { createAuthOptions } from '../../src/modules/auth/auth.options.js';
import { DatabaseService } from '../../src/shared/database/database.service.js';
import { OrganizationRepository } from '../../src/modules/organization/organization.repository.js';
import { ImagesRepository } from '../../src/modules/images/images.repository.js';
import { StorageService } from '../../src/shared/storage/storage.service.js';
import { setupDocumentation } from '../../src/shared/config/documentation.js';
import { setupHttp } from '../../src/shared/config/http.js';
import { validateEnv } from '../../src/shared/config/env.js';
import type { Environment } from '../../src/shared/config/env.js';

describe('API HTTP (persistência em memória e S3 simulado)', () => {
  let app: NestExpressApplication;
  let owner: ReturnType<typeof request.agent>;
  let outsider: ReturnType<typeof request.agent>;
  let organizationId: string;
  let foreignOrganizationId: string;
  let imageId: string;
  const store: MemoryDB = {
    user: [],
    session: [],
    account: [],
    verification: [],
    organization: [],
    member: [],
    invitation: [],
  };
  const records = new Map<string, Record<string, unknown>>();
  const repository = {
    create: vi.fn(async (orgId: string, prefix: string) => {
      // Simula o DEFAULT uuidv7() do PostgreSQL.
      const id = '019a1234-5678-7000-8000-123456789abc';
      const row = {
        id,
        organizationId: orgId,
        key: `images/${orgId}/${prefix}/${id}`,
        contentType: null,
        size: null,
        status: 'pending',
      };
      records.set(id, row);
      return row;
    }),
    findById: vi.fn(async (orgId: string, id: string) => {
      const row = records.get(id);
      return row?.organizationId === orgId ? row : undefined;
    }),
    markReady: vi.fn(
      async (orgId: string, id: string, metadata: { contentType: string; size: number }) => {
        const row = records.get(id);
        if (row?.organizationId !== orgId) return undefined;
        Object.assign(row, metadata, { status: 'ready' });
        return row;
      },
    ),
  };
  const storage = {
    presignUpload: vi.fn().mockResolvedValue('https://s3.example.com/upload'),
    head: vi.fn(),
    presignDownload: vi.fn().mockResolvedValue('https://s3.example.com/download'),
    expiresIn: 300,
  };

  beforeAll(async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/test');
    vi.stubEnv('S3_REGION', 'us-east-1');
    vi.stubEnv('S3_BUCKET', 'test-images');
    vi.stubEnv('FRONTEND_URL', 'http://localhost:3000');
    vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:5000');
    vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-with-at-least-32-characters');
    const config = new ConfigService<Environment, true>(
      validateEnv({
        DATABASE_URL: process.env.DATABASE_URL,
        S3_REGION: 'us-east-1',
        S3_BUCKET: 'test-images',
        BETTER_AUTH_URL: 'http://localhost:5000',
        BETTER_AUTH_SECRET: 'test-secret-with-at-least-32-characters',
      }),
    );
    // Executa os handlers reais do Better Auth; somente a persistência é substituída.
    const auth = betterAuth({
      ...createAuthOptions(config),
      database: memoryAdapter(store),
      rateLimit: { enabled: false },
    });
    const { AppModule } = await import('../../src/app.module.js');
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseService)
      .useValue({})
      .overrideProvider(AuthService)
      .useValue({
        auth,
        getSession: AuthService.prototype.getSession.bind({ auth } as unknown as AuthService),
      })
      .overrideProvider(OrganizationRepository)
      .useValue({
        findAllForUser: async (userId: string) =>
          store.member
            .filter((membership) => membership.userId === userId)
            .flatMap((membership) => {
              const org = store.organization.find(
                (entry) => entry.id === membership.organizationId,
              );
              return org
                ? [{ id: org.id, name: org.name, slug: org.slug, role: membership.role }]
                : [];
            }),
        findMembership: async (orgId: string, userId: string) =>
          store.member.find(
            (member) => member.organizationId === orgId && member.userId === userId,
          ),
      })
      .overrideProvider(ImagesRepository)
      .useValue(repository)
      .overrideProvider(StorageService)
      .useValue(storage)
      .compile();
    app = module.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    setupHttp(app);
    setupDocumentation(app);
    await app.init();
    owner = request.agent(app.getHttpServer());
    outsider = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app?.close();
    vi.unstubAllEnvs();
  });

  it('serve aplicação e documentação incluindo Auth e Organization', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
    await request(app.getHttpServer()).get('/docs').expect(200);
    await request(app.getHttpServer()).get('/swagger').expect(200);
    await request(app.getHttpServer()).get('/api/auth/ok').expect(200);
    const response = await request(app.getHttpServer()).get('/openapi.json').expect(200);
    expect(
      response.body.paths['/images/upload-url'].post.requestBody.content['application/json'].schema,
    ).toMatchObject({
      required: ['key'],
    });
    expect(
      response.body.paths['/organizations'].get.responses['200'].content['application/json'].schema
        .items.properties.role,
    ).toBeDefined();
    const authSchema = await request(app.getHttpServer())
      .get('/api/auth/open-api/generate-schema')
      .expect(200);
    expect(authSchema.body.paths['/organization/create']).toBeDefined();
  });

  it('exige sessão e permite CORS com cookies somente para a origem configurada', async () => {
    await request(app.getHttpServer()).get('/organizations').expect(401);
    await request(app.getHttpServer()).post('/images/upload-url').send({}).expect(401);
    const response = await request(app.getHttpServer())
      .options('/api/auth/sign-in/email')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('cadastra e autentica com cookie, rejeita senha inválida e exige organização ativa', async () => {
    const signup = await owner
      .post('/api/auth/sign-up/email')
      .set('Origin', 'http://localhost:3000')
      .send({
        name: 'Owner',
        email: 'owner@example.com',
        password: 'test-password-123',
      })
      .expect(200);
    expect(signup.headers['set-cookie']).toBeDefined();
    expect(JSON.stringify(signup.body)).not.toContain('test-password-123');
    const session = await owner.get('/api/auth/get-session').expect(200);
    expect(session.body.user.email).toBe('owner@example.com');
    await owner.get('/organizations').expect(200).expect([]);
    await owner.post('/images/upload-url').send({}).expect(400);
    await owner.post('/images/upload-url').send({ key: 'user-image' }).expect(403);
    await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: 'owner@example.com', password: 'wrong-password' })
      .expect(401);
  });

  it('cria organização, lista e seleciona como ativa', async () => {
    const created = await owner
      .post('/api/auth/organization/create')
      .set('Origin', 'http://localhost:3000')
      .send({ name: 'Owner Org', slug: 'owner-org' })
      .expect(200);
    organizationId = created.body.id;
    expect(organizationId).toBeTruthy();
    const list = await owner.get('/api/auth/organization/list').expect(200);
    expect(list.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: organizationId })]),
    );
    await owner
      .post('/api/auth/organization/set-active')
      .set('Origin', 'http://localhost:3000')
      .send({ organizationId })
      .expect(200);
    const activeSession = await owner.get('/api/auth/get-session').expect(200);
    expect(activeSession.body.session.activeOrganizationId).toBe(organizationId);
  });

  it('renova por duas horas somente a sessão validada e não recupera sessões expiradas', async () => {
    const agent = request.agent(app.getHttpServer());
    const signup = await agent
      .post('/api/auth/sign-up/email')
      .send({ name: 'Sliding', email: 'sliding@example.com', password: 'test-password-123' })
      .expect(200);
    const current = store.session.find((entry) => entry.userId === signup.body.user.id)!;
    const otherLogin = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: 'sliding@example.com', password: 'test-password-123' })
      .expect(200);
    const other = store.session.find((entry) => entry.token === otherLogin.body.token)!;
    const otherExpiry = new Date(other.expiresAt).getTime();
    const createdAt = new Date(current.createdAt).getTime();
    expect(new Date(current.expiresAt).getTime() - createdAt).toBeCloseTo(7_200_000, -3);

    vi.useFakeTimers({ toFake: ['Date'] });
    try {
      const now = new Date(Date.now() + 60 * 60 * 1000);
      vi.setSystemTime(now);
      const session = await agent.get('/api/auth/get-session').expect(200);
      expect(new Date(session.body.session.expiresAt).getTime()).toBe(now.getTime() + 7_200_000);
      expect(session.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('Max-Age=7200')]),
      );

      // Passa do vencimento original: o cookie renovado ainda permite autenticar.
      vi.setSystemTime(new Date(now.getTime() + 90 * 60 * 1000));
      const protectedResponse = await agent
        .post('/images/upload-url')
        .send({ key: 'user-image' })
        .expect(403); // Sessão válida, mas sem organização ativa.
      expect(protectedResponse.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('Max-Age=7200')]),
      );
      const renewed = store.session.find((entry) => entry.id === current.id)!;
      expect(new Date(renewed.expiresAt).getTime()).toBe(Date.now() + 7_200_000);
      expect(
        new Date(store.session.find((entry) => entry.id === other.id)!.expiresAt).getTime(),
      ).toBe(otherExpiry);

      vi.setSystemTime(new Date(Date.now() + 7_200_001));
      await agent.post('/images/upload-url').send({ key: 'user-image' }).expect(401);
      expect(store.session.find((entry) => entry.id === current.id)).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('valida JSON e parâmetros com Zod após autenticar', async () => {
    await owner.post('/images/upload-url').send({ key: 'car-image' }).expect(400);
    await owner.post('/images/upload-url').send({ key: 'car-image/rear' }).expect(400);
    await owner.post('/images/upload-url').send({ key: 'user-image', size: 100 }).expect(400);
    await owner.post('/images/upload-url').send({ key: 'user-image', id: 'custom' }).expect(400);
    await owner.get('/images/invalid/download-url').expect(400);
    expect(storage.presignUpload).not.toHaveBeenCalled();
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('executa upload, confirmação e leitura no escopo da organização', async () => {
    const input = { key: 'user-image' };
    const upload = await owner.post('/images/upload-url').send(input).expect(201);
    imageId = upload.body.id;
    expect(upload.body.status).toBe('pending');
    expect(imageId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(storage.presignUpload).toHaveBeenCalledWith(
      `images/${organizationId}/user-image/${imageId}`,
    );
    await owner.get(`/images/${imageId}/download-url`).expect(400);
    storage.head.mockResolvedValue({
      ContentLength: 100,
      ContentType: 'image/png',
    });
    await owner.post(`/images/${imageId}/complete`).expect(200);
    const download = await owner.get(`/images/${imageId}/download-url`).expect(200);
    expect(download.body.url).toBe('https://s3.example.com/download');
  });

  it('impede acesso a imagens e seleção de organização de outro usuário', async () => {
    await outsider
      .post('/api/auth/sign-up/email')
      .set('Origin', 'http://localhost:3000')
      .send({
        name: 'Other',
        email: 'other@example.com',
        password: 'test-password-123',
      })
      .expect(200);
    const otherOrg = await outsider
      .post('/api/auth/organization/create')
      .set('Origin', 'http://localhost:3000')
      .send({ name: 'Other Org', slug: 'other-org' })
      .expect(200);
    foreignOrganizationId = otherOrg.body.id;
    await outsider
      .post('/api/auth/organization/set-active')
      .set('Origin', 'http://localhost:3000')
      .send({ organizationId: foreignOrganizationId })
      .expect(200);
    await outsider.get(`/images/${imageId}/download-url`).expect(404);
    const ownOrganizations = await owner.get('/organizations').expect(200);
    expect(ownOrganizations.body).toEqual([
      { id: organizationId, name: 'Owner Org', slug: 'owner-org', role: 'owner' },
    ]);
    expect(ownOrganizations.headers['cache-control']).toBe('private, no-store');
    const ownerUserId = store.user.find((entry) => entry.email === 'owner@example.com')!.id;
    const outsiderOrganizations = await outsider
      .get(`/organizations?userId=${ownerUserId}&organizationId=${organizationId}`)
      .expect(200);
    expect(outsiderOrganizations.body).toEqual([
      { id: foreignOrganizationId, name: 'Other Org', slug: 'other-org', role: 'owner' },
    ]);
    await outsider.post(`/images/${imageId}/complete`).expect(404);
    await outsider
      .post('/api/auth/organization/set-active')
      .set('Origin', 'http://localhost:3000')
      .send({ organizationId })
      .expect(403);
  });

  it('cria convites e aplica as permissões padrão de membros', async () => {
    const invitation = await owner
      .post('/api/auth/organization/invite-member')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'other@example.com', role: 'member', organizationId })
      .expect(200);
    await outsider
      .post('/api/auth/organization/accept-invitation')
      .set('Origin', 'http://localhost:3000')
      .send({ invitationId: invitation.body.id })
      .expect(200);
    await outsider
      .post('/api/auth/organization/set-active')
      .set('Origin', 'http://localhost:3000')
      .send({ organizationId })
      .expect(200);
    await outsider
      .post('/api/auth/organization/invite-member')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'third@example.com', role: 'admin', organizationId })
      .expect(403);
    await outsider.get(`/images/${imageId}/download-url`).expect(200);
    const organizations = await outsider.get('/organizations').expect(200);
    expect(organizations.body).toEqual(
      expect.arrayContaining([
        { id: organizationId, name: 'Owner Org', slug: 'owner-org', role: 'member' },
      ]),
    );
  });

  it('revoga acesso após remover vínculo e encerra a sessão no logout', async () => {
    const otherMember = store.member.find(
      (member) => member.organizationId === organizationId && member.role === 'member',
    );
    await owner
      .post('/api/auth/organization/remove-member')
      .set('Origin', 'http://localhost:3000')
      .send({ memberIdOrEmail: otherMember.id, organizationId })
      .expect(200);
    await outsider.get(`/images/${imageId}/download-url`).expect(403);
    const organizations = await outsider.get('/organizations').expect(200);
    expect(organizations.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: organizationId })]),
    );
    await owner
      .post('/api/auth/sign-out')
      .set('Origin', 'http://localhost:3000')
      .send({})
      .expect(200);
    await owner.get(`/images/${imageId}/download-url`).expect(401);
  });

  it('rejeita origens não confiáveis em operações de autenticação', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .set('Origin', 'https://untrusted.example.com')
      .send({ email: 'owner@example.com', password: 'test-password-123' })
      .expect(403);
  });
});
