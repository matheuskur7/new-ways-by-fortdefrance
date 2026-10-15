import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/db/prisma.service.js';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findForUser(userId: string) {
    return this.prisma.member.findMany({
      where: { userId },
      select: {
        role: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { organization: { name: 'asc' } },
    });
  }

  async hasMembership(organizationId: string, userId: string) {
    return Boolean(
      await this.prisma.member.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
        select: { id: true },
      }),
    );
  }
}
