import { describe, expect, it, vi } from 'vitest';
import { OrganizationService } from '../../../src/modules/organization/organization.service.js';
import type { OrganizationRepository } from '../../../src/modules/organization/organization.repository.js';
import { authSession } from '../../fixtures/auth.js';

describe('OrganizationService', () => {
  it('lista pelos vínculos do usuário mesmo sem organização ativa', async () => {
    const rows = [{ id: 'org-a', name: 'Empresa A', slug: 'empresa-a', role: 'owner' }];
    const repository = { findAllForUser: vi.fn().mockResolvedValue(rows) };
    const service = new OrganizationService(repository as unknown as OrganizationRepository);
    await expect(
      service.list({
        ...authSession,
        session: { ...authSession.session, activeOrganizationId: null },
      }),
    ).resolves.toBe(rows);
    expect(repository.findAllForUser).toHaveBeenCalledWith(authSession.user.id);
  });
});
