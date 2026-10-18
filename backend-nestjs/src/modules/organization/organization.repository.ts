import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../shared/database/database.service.js';
import { member, organization } from '../../shared/database/schemas/organization.schema.js';
import type { OrganizationListDto } from './dto/organizations.dto.js';

@Injectable()
export class OrganizationRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  findAllForUser(userId: string): Promise<OrganizationListDto> {
    return this.database.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        role: member.role,
      })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId))
      .orderBy(asc(organization.name), asc(organization.id));
  }

  async findMembership(organizationId: string, userId: string) {
    const [membership] = await this.database.db
      .select()
      .from(member)
      .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
      .limit(1);
    return membership;
  }
}
