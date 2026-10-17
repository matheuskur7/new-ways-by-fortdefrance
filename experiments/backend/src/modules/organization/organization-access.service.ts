import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.config.js';
import { OrganizationRepository } from './organization.repository.js';

@Injectable()
export class OrganizationAccessService {
  constructor(private readonly repository: OrganizationRepository) {}

  async requireManager(session: AuthSession, organizationId: string) {
    const membership = await this.repository.findMembership(
      organizationId,
      session.user.id,
    );
    if (
      !membership ||
      !membership.role
        .split(',')
        .some((role) => ['owner', 'admin'].includes(role.trim()))
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para gerenciar esta empresa.',
      );
    }
    return membership.organization;
  }

  async requireActiveOrganization(session: AuthSession): Promise<string> {
    const organizationId = session.session.activeOrganizationId;
    if (
      !organizationId ||
      !(await this.repository.hasMembership(organizationId, session.user.id))
    ) {
      throw new ForbiddenException(
        'Selecione uma empresa da qual você faz parte.',
      );
    }
    return organizationId;
  }
}
