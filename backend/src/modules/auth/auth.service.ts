import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { PrismaService } from '../../shared/db/prisma.service.js';
import { createAuth } from './auth.config.js';
import type { Auth, AuthSession } from './auth.config.js';

@Injectable()
export class AuthService {
  readonly auth: Auth;
  private readonly trustedOrigins: Set<string>;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.auth = createAuth(prisma, config);
    this.trustedOrigins = new Set([
      new URL(config.getOrThrow<string>('FRONTEND_URL')).origin,
      new URL(config.getOrThrow<string>('BETTER_AUTH_URL')).origin,
    ]);
  }

  assertTrustedOrigin(headers: IncomingHttpHeaders): void {
    const origin = headers.origin;
    if (typeof origin !== 'string' || !this.trustedOrigins.has(origin)) {
      throw new ForbiddenException('Origem da requisição não permitida.');
    }
  }

  getSession(headers: IncomingHttpHeaders) {
    return this.auth.api.getSession({ headers: fromNodeHeaders(headers) });
  }

  async getContext(session: AuthSession) {
    const organizationId = session.session.activeOrganizationId;
    const member = organizationId
      ? await this.prisma.member.findUnique({
          where: {
            organizationId_userId: { organizationId, userId: session.user.id },
          },
          include: { organization: true },
        })
      : null;
    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
      },
      organization: member
        ? {
            id: member.organization.id,
            name: member.organization.name,
            slug: member.organization.slug,
            role: member.role,
          }
        : null,
    };
  }
}
