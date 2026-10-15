import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.config.js';
import { OrganizationRepository } from './organization.repository.js';

@Injectable()
export class OrganizationAccessService {
  constructor(private readonly repository: OrganizationRepository) {}

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
