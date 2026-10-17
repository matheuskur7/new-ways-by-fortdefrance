import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrganizationAccessService } from '../../../src/modules/organization/organization-access.service.js';
import { OrganizationRepository } from '../../../src/modules/organization/organization.repository.js';
import { authSession } from '../../fixtures/auth.js';

describe('OrganizationAccessService', () => {
  const repository = { findMembership: vi.fn() };
  const service = new OrganizationAccessService(
    repository as unknown as OrganizationRepository,
  );

  beforeEach(() => vi.resetAllMocks());

  it('exige organização ativa', async () => {
    await expect(
      service.requireActiveOrganization({
        ...authSession,
        session: { ...authSession.session, activeOrganizationId: null },
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.findMembership).not.toHaveBeenCalled();
  });

  it('verifica vínculo atual no banco a cada operação, mesmo com sessão válida', async () => {
    repository.findMembership
      .mockResolvedValueOnce({ id: 'member-test' })
      .mockResolvedValueOnce(undefined);
    expect(await service.requireActiveOrganization(authSession)).toBe(
      'org-test',
    );
    await expect(
      service.requireActiveOrganization(authSession),
    ).rejects.toThrow(ForbiddenException);
    expect(repository.findMembership).toHaveBeenNthCalledWith(
      1,
      'org-test',
      'user-test',
    );
    expect(repository.findMembership).toHaveBeenNthCalledWith(
      2,
      'org-test',
      'user-test',
    );
  });
});
