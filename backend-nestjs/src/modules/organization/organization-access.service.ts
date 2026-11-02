import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.factory.js';
import { OrganizationRepository } from './organization.repository.js';

@Injectable()
export class OrganizationAccessService {
  constructor(
    @Inject(OrganizationRepository)
    private readonly repository: OrganizationRepository,
  ) {}

  async requireActiveOrganization(session: AuthSession) {
    const organizationId = session.session.activeOrganizationId;
    if (!organizationId) {
      throw new ForbiddenException('Selecione uma organização ativa.');
    }
    const membership = await this.repository.findMembership(organizationId, session.user.id);
    if (!membership) {
      throw new ForbiddenException('Você não pertence à organização ativa.');
    }
    return organizationId;
  }

  async requireManager(session: AuthSession) {
    const organizationId = await this.requireActiveOrganization(session);
    const membership = await this.repository.findMembership(organizationId, session.user.id);
    if (!membership?.role.split(',').some((role) => ['owner', 'admin'].includes(role.trim()))) {
      throw new ForbiddenException(
        'Somente proprietários e administradores podem gerenciar as taxas.',
      );
    }
    return organizationId;
  }
}
