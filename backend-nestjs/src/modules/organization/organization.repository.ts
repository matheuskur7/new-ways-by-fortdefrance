import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DatabaseService } from '../../shared/database/database.service.js';
import { member } from '../../shared/database/schemas/organization.schema.js';

@Injectable()
export class OrganizationRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async findMembership(organizationId: string, userId: string) {
    const [membership] = await this.database.db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
      .limit(1);
    return membership;
  }
}
