import { Inject, Injectable } from '@nestjs/common';
import type { AuthSession } from '../auth/auth.factory.js';
import { OrganizationRepository } from './organization.repository.js';

@Injectable()
export class OrganizationService {
  constructor(
    @Inject(OrganizationRepository) private readonly repository: OrganizationRepository,
  ) {}

  list(session: AuthSession) {
    // A seleção antecede a organização ativa: consulta os vínculos do usuário da sessão.
    return this.repository.findAllForUser(session.user.id);
  }
}
