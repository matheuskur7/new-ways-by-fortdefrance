import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import type { AuthSession } from './auth.config.js';
import { PUBLIC_ROUTE } from './public.decorator.js';
import { getRequestSession } from './request-session.js';

export type AuthenticatedRequest = Request & { authSession: AuthSession };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly service: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await getRequestSession(request, this.service);
    if (!session) throw new UnauthorizedException('Autenticação necessária.');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      this.service.assertTrustedOrigin(request.headers);
    }
    request.authSession = session;
    return true;
  }
}
