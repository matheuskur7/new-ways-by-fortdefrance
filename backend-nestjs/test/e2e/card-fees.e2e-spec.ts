import 'reflect-metadata';
import { StandardSchemaValidationPipe, UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CardFeesController } from '../../src/modules/card-fees/card-fees.controller.js';
import { CardFeesService } from '../../src/modules/card-fees/card-fees.service.js';
import { CardFeesRepository } from '../../src/modules/card-fees/card-fees.repository.js';
import { AuthGuard } from '../../src/modules/auth/auth.guard.js';
import type { AuthenticatedRequest } from '../../src/modules/auth/auth.guard.js';
import { OrganizationAccessService } from '../../src/modules/organization/organization-access.service.js';
import { OrganizationRepository } from '../../src/modules/organization/organization.repository.js';
import { authSession } from '../fixtures/auth.js';

const providerId = '019a1234-5678-7000-8000-123456789001';
const brandId = '019a1234-5678-7000-8000-123456789002';
const otherId = '019a1234-5678-7000-8000-123456789003';
const provider = { name: 'Provedor', logo: null };
const brandData = {
  providerId,
  name: 'Visa',
  channel: 'Presencial',
  displayOrder: 10,
  logo: null,
  rates: Array.from({ length: 18 }, (_, index) => ({
    installments: index + 1,
    ratePercent: '3.94',
  })),
};

// Controller, validação, service e autorização reais; banco e sessão simulados.
describe('Gerenciamento HTTP de taxas', () => {
  let app: INestApplication;
  let revoked = false;
  const createdAt = new Date('2026-01-01T10:00:00.000Z');
  const updatedAt = new Date('2026-02-01T12:30:00.000Z');
  const audit = { organizationId: 'org-test', createdAt, updatedAt };
  const isoDates = { createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
  const repository = {
    reorderBrands: vi.fn(async (organizationId: string, id: string, ids: string[]) =>
      organizationId !== 'org-test' || id !== providerId
        ? 'not-found'
        : ids.length === 1 && ids[0] === brandId
          ? 'ok'
          : 'stale',
    ),
    hasProviderBrands: vi.fn(
      async (organizationId: string, id: string) => organizationId === 'org-test' && id === brandId,
    ),
    removeProvider: vi.fn(async (organizationId: string, id: string) => {
      if (organizationId !== 'org-test') return undefined;
      if (id === brandId) throw new Error('db', { cause: { code: '23503' } });
      return id === providerId ? { id } : undefined;
    }),
    removeBrand: vi.fn(async (organizationId: string, id: string) =>
      organizationId === 'org-test' && id === brandId ? { id } : undefined,
    ),
    listProviders: vi.fn(async (organizationId: string) =>
      organizationId === 'org-test' ? [{ ...audit, id: providerId, ...provider }] : [],
    ),
    listBrands: vi.fn(async (organizationId: string) =>
      organizationId === 'org-test' ? [{ ...audit, ...brandData, id: brandId }] : [],
    ),
    saveProvider: vi.fn(async (organizationId: string, data: typeof provider, id?: string) => {
      if (data.name === 'Duplicado') throw new Error('db', { cause: { code: '23505' } });
      return organizationId === 'org-test'
        ? { ...audit, ...data, id: id ?? providerId }
        : undefined;
    }),
    findProvider: vi.fn(async (organizationId: string, id: string) =>
      organizationId === 'org-test' && id === providerId ? { id } : undefined,
    ),
    saveBrand: vi.fn(async (organizationId: string, data: typeof brandData, id?: string) =>
      organizationId === 'org-test' && (!id || id === brandId)
        ? { ...audit, ...data, id: id ?? brandId }
        : undefined,
    ),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CardFeesController],
      providers: [
        CardFeesService,
        OrganizationAccessService,
        { provide: CardFeesRepository, useValue: repository },
        {
          provide: OrganizationRepository,
          useValue: {
            findMembership: vi.fn(async (_organizationId: string, userId: string) =>
              revoked ? undefined : { role: userId === 'member' ? 'member' : 'owner' },
            ),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate(context: ExecutionContext) {
          const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
          if (!req.headers['x-test-user']) throw new UnauthorizedException();
          req.authSession = {
            ...authSession,
            user: { ...authSession.user, id: String(req.headers['x-test-user']) },
            session: {
              ...authSession.session,
              activeOrganizationId: String(req.headers['x-test-company'] ?? 'org-test'),
            },
          };
          return true;
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('exige sessão e retorna provedores e bandeiras com taxas em JSON', async () => {
    await request(app.getHttpServer()).get('/card-fees/catalog').expect(401);
    const response = await request(app.getHttpServer())
      .get('/card-fees/catalog')
      .set('x-test-user', 'owner')
      .expect(200);
    expect(response.body.providers).toEqual([{ id: providerId, ...provider, ...isoDates }]);
    expect(response.body.brands[0].rates).toHaveLength(18);
    expect(Object.keys(response.body.brands[0]).sort()).toEqual([
      'channel',
      'createdAt',
      'displayOrder',
      'id',
      'logo',
      'name',
      'providerId',
      'rates',
      'updatedAt',
    ]);
    expect(Object.keys(response.body.brands[0].rates[0]).sort()).toEqual([
      'installments',
      'ratePercent',
    ]);
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('cria e edita provedor e bandeira com 18 taxas', async () => {
    for (const [method, path] of [
      ['post', '/card-fees/providers'],
      ['patch', `/card-fees/providers/${providerId}`],
    ] as const) {
      const response = await request(app.getHttpServer())
        [method](path)
        .set('x-test-user', 'owner')
        .send({ name: 'Provedor', logo: '<svg viewBox="0 0 1 1"></svg>' })
        .expect(method === 'post' ? 201 : 200);
      expect(response.body).toEqual({
        id: providerId,
        name: 'Provedor',
        logo: '<svg viewBox="0 0 1 1"></svg>',
        ...isoDates,
      });
    }
    for (const [method, path] of [
      ['post', '/card-fees/brands'],
      ['patch', `/card-fees/brands/${brandId}`],
    ] as const) {
      const response = await request(app.getHttpServer())
        [method](path)
        .set('x-test-user', 'owner')
        .send(brandData)
        .expect(method === 'post' ? 201 : 200);
      expect(response.body).toEqual({ ...brandData, id: brandId, ...isoDates });
    }
    await request(app.getHttpServer())
      .post(`/card-fees/brands/${brandId}/rates`)
      .set('x-test-user', 'owner')
      .send({ installments: 24, ratePercent: '8.99' })
      .expect(404);
  });

  it('rejeita payloads inválidos e conflitos sem sucesso falso', async () => {
    for (const body of [
      { ...brandData, organizationId: 'foreign' },
      { ...brandData, rates: [] },
      { ...brandData, rates: [brandData.rates[0], brandData.rates[0]] },
      { ...brandData, rates: [{ installments: 1, ratePercent: '100.00' }] },
      { ...brandData, logo: 'https://example.com/logo.png' },
    ]) {
      await request(app.getHttpServer())
        .post('/card-fees/brands')
        .set('x-test-user', 'owner')
        .send(body)
        .expect(400);
    }
    await request(app.getHttpServer())
      .patch('/card-fees/providers/invalid')
      .set('x-test-user', 'owner')
      .send(provider)
      .expect(400);
    await request(app.getHttpServer())
      .post('/card-fees/providers')
      .set('x-test-user', 'owner')
      .send({ name: 'Provedor' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/card-fees/providers')
      .set('x-test-user', 'owner')
      .send({ ...provider, name: 'Duplicado' })
      .expect(409);
  });

  it('não expõe nem altera registros de outra empresa', async () => {
    const response = await request(app.getHttpServer())
      .get('/card-fees/catalog')
      .set('x-test-user', 'owner')
      .set('x-test-company', 'other-company')
      .expect(200);
    expect(response.body).toEqual({ providers: [], brands: [] });
    await request(app.getHttpServer())
      .patch(`/card-fees/providers/${providerId}`)
      .set('x-test-user', 'owner')
      .set('x-test-company', 'other-company')
      .send(provider)
      .expect(404);
    await request(app.getHttpServer())
      .post('/card-fees/brands')
      .set('x-test-user', 'owner')
      .set('x-test-company', 'other-company')
      .send(brandData)
      .expect(404);
  });

  it('remove bandeira e provedor com 204, preserva vínculos e exige empresa/permissão', async () => {
    await request(app.getHttpServer()).delete(`/card-fees/brands/${brandId}`).expect(401);
    await request(app.getHttpServer())
      .delete(`/card-fees/brands/${brandId}`)
      .set('x-test-user', 'member')
      .expect(403);
    const conflict = await request(app.getHttpServer())
      .delete(`/card-fees/providers/${brandId}`)
      .set('x-test-user', 'owner')
      .expect(409);
    expect(conflict.body.message).toBe('Remova as bandeiras deste provedor antes de removê-lo.');
    for (const path of [`/card-fees/providers/${providerId}`, `/card-fees/brands/${brandId}`]) {
      await request(app.getHttpServer())
        .delete(path)
        .set('x-test-user', 'owner')
        .set('x-test-company', 'other-company')
        .expect(404);
      const response = await request(app.getHttpServer())
        .delete(path)
        .set('x-test-user', 'owner')
        .expect(204);
      expect(response.text).toBe('');
    }
    await request(app.getHttpServer())
      .delete('/card-fees/providers/invalid')
      .set('x-test-user', 'owner')
      .expect(400);
  });

  it('reordena somente as bandeiras completas do provedor e da empresa ativa', async () => {
    const path = `/card-fees/providers/${providerId}/brands/order`;
    await request(app.getHttpServer())
      .patch(path)
      .send({ brandIds: [brandId] })
      .expect(401);
    await request(app.getHttpServer())
      .patch(path)
      .set('x-test-user', 'member')
      .send({ brandIds: [brandId] })
      .expect(403);
    await request(app.getHttpServer())
      .patch(path)
      .set('x-test-user', 'owner')
      .send({ brandIds: [brandId] })
      .expect(204);
    await request(app.getHttpServer())
      .patch(path)
      .set('x-test-user', 'owner')
      .set('x-test-company', 'other-company')
      .send({ brandIds: [brandId] })
      .expect(404);
    await request(app.getHttpServer())
      .patch(path)
      .set('x-test-user', 'owner')
      .send({ brandIds: [otherId] })
      .expect(409);
    for (const brandIds of [[], ['invalid'], [brandId, brandId]]) {
      await request(app.getHttpServer())
        .patch(path)
        .set('x-test-user', 'owner')
        .send({ brandIds })
        .expect(400);
    }
  });

  it('bloqueia membro comum e vínculo removido antes de acessar o catálogo', async () => {
    await request(app.getHttpServer())
      .post('/card-fees/providers')
      .set('x-test-user', 'member')
      .send({ name: 'Nome', logo: null })
      .expect(403);
    revoked = true;
    try {
      await request(app.getHttpServer())
        .get('/card-fees/catalog')
        .set('x-test-user', 'owner')
        .expect(403);
      await request(app.getHttpServer())
        .post('/card-fees/providers')
        .set('x-test-user', 'owner')
        .send({ name: 'Nome', logo: null })
        .expect(403);
    } finally {
      revoked = false;
    }
  });
});
