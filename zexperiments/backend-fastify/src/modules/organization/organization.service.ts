import { Injectable } from '@nestjs/common';
import { OrganizationAccessService } from './organization-access.service.js';
import type { AuthSession } from '../auth/auth.config.js';
import { OrganizationRepository } from './organization.repository.js';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly repository: OrganizationRepository,
    private readonly access: OrganizationAccessService,
  ) {}

  async getSettings(session: AuthSession, organizationId: string) {
    const organization = await this.access.requireManager(
      session,
      organizationId,
    );
    const [members, invitations] = await Promise.all([
      this.repository.findMembers(organizationId),
      this.repository.findInvitations(organizationId),
    ]);
    return { organization, members, invitations };
  }

  async listForUser(userId: string) {
    const memberships = await this.repository.findForUser(userId);
    return memberships.map(({ organization, role }) => ({
      ...organization,
      role,
    }));
  }
}
