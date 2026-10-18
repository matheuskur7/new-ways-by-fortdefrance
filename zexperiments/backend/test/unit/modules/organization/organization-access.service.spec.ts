import { ForbiddenException } from '@nestjs/common';
import type { AuthSession } from '../../../../src/modules/auth/auth.config.js';
import { OrganizationAccessService } from '../../../../src/modules/organization/organization-access.service.js';
import { OrganizationRepository } from '../../../../src/modules/organization/organization.repository.js';
import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';

describe('Organization access (mocked database)', () => {
  const prisma = { member: { findUnique: vi.fn() } };
  const repository = new OrganizationRepository(
    prisma as unknown as PrismaService,
  );
  const service = new OrganizationAccessService(repository);
  const session = {
    user: { id: 'alice' },
    session: { activeOrganizationId: 'company-a' },
  } as AuthSession;

  beforeEach(() => vi.resetAllMocks());

  it('resolves the active company using both the company and authenticated user', async () => {
    prisma.member.findUnique.mockResolvedValue({ id: 'membership' });
    await expect(service.requireActiveOrganization(session)).resolves.toBe(
      'company-a',
    );
    expect(prisma.member.findUnique).toHaveBeenCalledWith({
      where: {
        organizationId_userId: { organizationId: 'company-a', userId: 'alice' },
      },
      select: { id: true },
    });
  });

  it('rejects a missing active company without querying membership', async () => {
    await expect(
      service.requireActiveOrganization({
        ...session,
        session: { ...session.session, activeOrganizationId: null },
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.member.findUnique).not.toHaveBeenCalled();
  });

  it('rechecks membership on each call and rejects access after removal', async () => {
    prisma.member.findUnique
      .mockResolvedValueOnce({ id: 'membership' })
      .mockResolvedValueOnce(null);
    await expect(service.requireActiveOrganization(session)).resolves.toBe(
      'company-a',
    );
    await expect(service.requireActiveOrganization(session)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.member.findUnique).toHaveBeenCalledTimes(2);
  });

  it('propagates database failures instead of granting access', async () => {
    prisma.member.findUnique.mockRejectedValue(
      new Error('Database unavailable'),
    );
    await expect(service.requireActiveOrganization(session)).rejects.toThrow(
      'Database unavailable',
    );
  });
});
