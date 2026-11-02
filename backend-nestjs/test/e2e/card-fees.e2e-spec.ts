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
const groupId = '019a1234-5678-7000-8000-123456789002';
const rateId = '019a1234-5678-7000-8000-123456789003';
const groupData = {
  providerId,
  name: 'Visa',
  channel: 'Presencial',
  displayOrder: 10,
  logoSvg: null,
  rates: Array.from({ length: 18 }, (_, index) => ({
    installments: index + 1,
    ratePercent: '3.94',
  })),
};

// Controller, validação, service e autorização reais; banco e sessão simulados.
describe('Gerenciamento HTTP de taxas', () => {
  let app: INestApplication;
  let revoked = false;
  const audit = { organizationId: 'org-test', createdAt: new Date(), updatedAt: new Date() };
  const repository = {
    reorderGroups: vi.fn(async (organizationId: string, id: string, ids: string[]) =>
      organizationId !== 'org-test' || id !== providerId
        ? 'not-found'
        : ids.length === 1 && ids[0] === groupId
          ? 'ok'
          : 'stale',
    ),
    hasProviderGroups: vi.fn(
      async (organizationId: string, id: string) => organizationId === 'org-test' && id === groupId,
    ),
    removeProvider: vi.fn(async (organizationId: string, id: string) => {
      if (organizationId !== 'org-test') return undefined;
      if (id === groupId) throw new Error('db', { cause: { code: '23503' } });
      return id === providerId ? { id } : undefined;
    }),
    removeGroup: vi.fn(async (organizationId: string, id: string) =>
      organizationId === 'org-test' && id === groupId ? { id } : undefined,
    ),
    listProviders: vi.fn(async (organizationId: string) =>
      organizationId === 'org-test' ? [{ ...audit, id: providerId, name: 'Provedor' }] : [],
    ),
    listGroups: vi.fn(async (organizationId: string) =>
      organizationId === 'org-test'
        ? [
            {
              ...audit,
              seedKey: 'VISA',
              ...groupData,
              id: groupId,
              rates: groupData.rates.map((rate) => ({
                ...rate,
                id: rateId,
                organizationId: 'org-test',
                groupId,
              })),
            },
          ]
        : [],
    ),
    saveProvider: vi.fn(async (organizationId: string, data: { name: string }, id?: string) => {
      if (data.name === 'Duplicado') throw new Error('db', { cause: { code: '23505' } });
      return organizationId === 'org-test'
        ? { ...audit, ...data, id: id ?? providerId }
        : undefined;
    }),
    findProvider: vi.fn(async (organizationId: string, id: string) =>
      organizationId === 'org-test' && id === providerId ? { id } : undefined,
    ),
    saveGroup: vi.fn(async (organizationId: string, data: typeof groupData, id?: string) =>
      organizationId === 'org-test' && (!id || id === groupId)
        ? {
            ...audit,
            seedKey: 'VISA',
            ...data,
            id: id ?? groupId,
            rates: data.rates.map((rate) => ({
              ...rate,
              id: rateId,
              organizationId: 'org-test',
              groupId,
            })),
          }
        : undefined,
    ),
    saveRate: vi.fn(
      async (
        organizationId: string,
        parentId: string,
        data: { installments: number; ratePercent: string },
        id?: string,
      ) =>
        organizationId === 'org-test' && parentId === groupId && (!id || id === rateId)
          ? { ...data, id: id ?? rateId, organizationId, groupId: parentId }
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

  it('exige sessão e retorna provedores mesmo sem grupos', async () => {
    await request(app.getHttpServer()).get('/card-fees/catalog').expect(401);
    const response = await request(app.getHttpServer())
      .get('/card-fees/catalog')
      .set('x-test-user', 'owner')
      .expect(200);
    expect(response.body.providers).toEqual([{ id: providerId, name: 'Provedor' }]);
    expect(response.body.groups[0].rates).toHaveLength(18);
    expect(Object.keys(response.body.providers[0]).sort()).toEqual(['id', 'name']);
    expect(Object.keys(response.body.groups[0]).sort()).toEqual([
      'channel',
      'displayOrder',
      'id',
      'logoSvg',
      'name',
      'providerId',
      'rates',
    ]);
    expect(Object.keys(response.body.groups[0].rates[0]).sort()).toEqual([
      'id',
      'installments',
      'ratePercent',
    ]);
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('cria e edita provedor, grupo com 18 taxas e taxa individual', async () => {
    for (const [method, path] of [
      ['post', '/card-fees/providers'],
      ['patch', `/card-fees/providers/${providerId}`],
    ] as const) {
      const response = await request(app.getHttpServer())
        [method](path)
        .set('x-test-user', 'owner')
        .send({ name: 'Provedor' })
        .expect(method === 'post' ? 201 : 200);
      expect(response.body.id).toBe(providerId);
    }
    for (const [method, path] of [
      ['post', '/card-fees/groups'],
      ['patch', `/card-fees/groups/${groupId}`],
    ] as const) {
      const response = await request(app.getHttpServer())
        [method](path)
        .set('x-test-user', 'owner')
        .send(groupData)
        .expect(method === 'post' ? 201 : 200);
      expect(response.body.rates).toHaveLength(18);
    }
    for (const [method, path] of [
      ['post', `/card-fees/groups/${groupId}/rates`],
      ['patch', `/card-fees/groups/${groupId}/rates/${rateId}`],
    ] as const) {
      const response = await request(app.getHttpServer())
        [method](path)
        .set('x-test-user', 'owner')
        .send({ installments: 24, ratePercent: '8.99' })
        .expect(method === 'post' ? 201 : 200);
      expect(response.body.installments).toBe(24);
    }
  });

  it('rejeita payloads inválidos e conflitos sem sucesso falso', async () => {
    for (const body of [
      { ...groupData, organizationId: 'foreign' },
      { ...groupData, rates: [groupData.rates[0], groupData.rates[0]] },
      { ...groupData, rates: [{ installments: 1, ratePercent: '100.00' }] },
    ]) {
      await request(app.getHttpServer())
        .post('/card-fees/groups')
        .set('x-test-user', 'owner')
        .send(body)
        .expect(400);
    }
    await request(app.getHttpServer())
      .patch('/card-fees/providers/invalid')
      .set('x-test-user', 'owner')
      .send({ name: 'Nome' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/card-fees/providers')
      .set('x-test-user', 'owner')
      .send({ name: 'Duplicado' })
      .expect(409);
  });

  it('não expõe nem altera registros de outra empresa', async () => {
    const response = await request(app.getHttpServer())
      .get('/card-fees/catalog')
      .set('x-test-user', 'owner')
      .set('x-test-company', 'other-company')
      .expect(200);
    expect(response.body).toEqual({ providers: [], groups: [] });
    await request(app.getHttpServer())
      .patch(`/card-fees/providers/${providerId}`)
      .set('x-test-user', 'owner')
      .set('x-test-company', 'other-company')
      .send({ name: 'Nome' })
      .expect(404);
    await request(app.getHttpServer())
      .post('/card-fees/groups')
      .set('x-test-user', 'owner')
      .set('x-test-company', 'other-company')
      .send(groupData)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/card-fees/groups/${groupId}/rates/${rateId}`)
      .set('x-test-user', 'owner')
      .set('x-test-company', 'other-company')
      .send({ installments: 18, ratePercent: '1.00' })
      .expect(404);
  });

  it('remove grupo e provedor com 204, preserva vínculos e exige empresa/permissão', async () => {
    await request(app.getHttpServer()).delete(`/card-fees/groups/${groupId}`).expect(401);
    await request(app.getHttpServer())
      .delete(`/card-fees/groups/${groupId}`)
      .set('x-test-user', 'member')
      .expect(403);
    const conflict = await request(app.getHttpServer())
      .delete(`/card-fees/providers/${groupId}`)
      .set('x-test-user', 'owner')
      .expect(409);
    expect(conflict.body.message).toBe('Remova os grupos deste provedor antes de removê-lo.');
    for (const path of [`/card-fees/providers/${providerId}`, `/card-fees/groups/${groupId}`]) {
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

  it('reordena somente os grupos completos do provedor e da empresa ativa', async () => {
    const path = `/card-fees/providers/${providerId}/groups/order`;
    await request(app.getHttpServer())
      .patch(path)
      .send({ groupIds: [groupId] })
      .expect(401);
    await request(app.getHttpServer())
      .patch(path)
      .set('x-test-user', 'member')
      .send({ groupIds: [groupId] })
      .expect(403);
    await request(app.getHttpServer())
      .patch(path)
      .set('x-test-user', 'owner')
      .send({ groupIds: [groupId] })
      .expect(204);
    await request(app.getHttpServer())
      .patch(path)
      .set('x-test-user', 'owner')
      .set('x-test-company', 'other-company')
      .send({ groupIds: [groupId] })
      .expect(404);
    await request(app.getHttpServer())
      .patch(path)
      .set('x-test-user', 'owner')
      .send({ groupIds: [rateId] })
      .expect(409);
    for (const groupIds of [[], ['invalid'], [groupId, groupId]]) {
      await request(app.getHttpServer())
        .patch(path)
        .set('x-test-user', 'owner')
        .send({ groupIds })
        .expect(400);
    }
  });

  it('bloqueia membro comum e vínculo removido antes de acessar o catálogo', async () => {
    await request(app.getHttpServer())
      .post('/card-fees/providers')
      .set('x-test-user', 'member')
      .send({ name: 'Nome' })
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
        .send({ name: 'Nome' })
        .expect(403);
    } finally {
      revoked = false;
    }
  });
});
