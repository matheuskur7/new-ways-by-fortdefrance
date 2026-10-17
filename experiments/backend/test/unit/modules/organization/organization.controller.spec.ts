import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { OrganizationModule } from '../../../../src/modules/organization/organization.module.js';
import { DbModule } from '../../../../src/shared/db/db.module.js';
import { PrismaService } from '../../../../src/shared/db/prisma.service.js';
import { AuthGuard } from '../../../../src/modules/auth/auth.guard.js';
import { AuthService } from '../../../../src/modules/auth/auth.service.js';

describe('Organizations and membership roles (mocked database)', () => {
  let app: NestExpressApplication;
  const findMany = vi.fn();
  const findUnique = vi.fn();
  const findInvitations = vi.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [DbModule, OrganizationModule],
      providers: [
        { provide: APP_GUARD, useClass: AuthGuard },
        {
          provide: AuthService,
          useValue: {
            getSession: vi.fn(async (headers: { cookie?: string }) =>
              headers.cookie === 'session=alice'
                ? {
                    user: { id: 'alice' },
                    session: { activeOrganizationId: null },
                  }
                : null,
            ),
          },
        },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue({
        member: { findMany, findUnique },
        invitation: { findMany: findInvitations },
      })
      .compile();
    app = module.createNestApplication<NestExpressApplication>();
    await app.init();
  });
  afterAll(async () => app?.close());
  beforeEach(() => vi.clearAllMocks());

  it('rejects anonymous requests without querying memberships', async () => {
    await request(app.getHttpServer()).get('/api/organizations').expect(401);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('returns each company role using only the authenticated user, even without an active company', async () => {
    findMany.mockResolvedValue([
      {
        role: 'owner',
        organization: { id: 'company-a', name: 'Matriz', slug: 'matriz' },
      },
      {
        role: 'member',
        organization: { id: 'company-b', name: 'Filial', slug: 'filial' },
      },
    ]);
    const response = await request(app.getHttpServer())
      .get('/api/organizations?userId=bob')
      .set('Cookie', 'session=alice')
      .expect(200);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'alice' },
      select: {
        role: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { organization: { name: 'asc' } },
    });
    expect(response.body).toEqual([
      { id: 'company-a', name: 'Matriz', slug: 'matriz', role: 'owner' },
      { id: 'company-b', name: 'Filial', slug: 'filial', role: 'member' },
    ]);
    expect(response.headers['cache-control']).toBe('private, no-store');
  });
  it('denies settings access to outsiders and ordinary members before listing any data', async () => {
    findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      role: 'member',
      organization: { id: 'company-a' },
    });
    for (let attempt = 0; attempt < 2; attempt++) {
      await request(app.getHttpServer())
        .get('/api/organizations/company-a/settings')
        .set('Cookie', 'session=alice')
        .expect(403);
    }
    expect(findMany).not.toHaveBeenCalled();
    expect(findInvitations).not.toHaveBeenCalled();
  });

  it('checks the requested company and returns only its active members and pending invitations to managers', async () => {
    const organization = { id: 'company-a', name: 'Matriz', slug: 'matriz' };
    findUnique.mockResolvedValueOnce({ role: 'admin', organization });
    findMany.mockResolvedValueOnce([]);
    findInvitations.mockResolvedValueOnce([]);
    const response = await request(app.getHttpServer())
      .get('/api/organizations/company-a/settings')
      .set('Cookie', 'session=alice')
      .expect(200);
    expect(response.body).toEqual({
      organization,
      members: [],
      invitations: [],
    });
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId_userId: {
            organizationId: 'company-a',
            userId: 'alice',
          },
        },
      }),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'company-a', user: { deletedAt: null } },
      }),
    );
    expect(findInvitations).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'company-a',
          status: 'pending',
          expiresAt: { gt: expect.any(Date) },
        },
      }),
    );
  });
});
