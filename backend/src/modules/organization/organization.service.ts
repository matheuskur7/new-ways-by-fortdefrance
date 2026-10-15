import { Injectable } from '@nestjs/common';
import { OrganizationRepository } from './organization.repository.js';

@Injectable()
export class OrganizationService {
  constructor(private readonly repository: OrganizationRepository) {}

  async listForUser(userId: string) {
    const memberships = await this.repository.findForUser(userId);
    return memberships.map(({ organization, role }) => ({
      ...organization,
      role,
    }));
  }
}
