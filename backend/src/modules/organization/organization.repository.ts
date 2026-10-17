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

  findMembership(organizationId: string, userId: string) {
    return this.prisma.member.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: {
        role: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  findMembers(organizationId: string) {
    return this.prisma.member.findMany({
      where: { organizationId, user: { deletedAt: null } },
      select: {
        id: true,
        role: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  findInvitations(organizationId: string) {
    return this.prisma.invitation.findMany({
      where: {
        organizationId,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
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
