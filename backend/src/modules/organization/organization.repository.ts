import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/db/prisma.service.js';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hasMembership(organizationId: string, userId: string) {
    return Boolean(
      await this.prisma.member.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
        select: { id: true },
      }),
    );
  }
}
