import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import type { AuthSession } from './auth.factory.js';

export type AuthenticatedRequest = Request & { authSession: AuthSession };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    const session = await this.authService.getSession(request.headers, response);
    if (!session) throw new UnauthorizedException('Sessão ausente ou expirada.');
    request.authSession = session;
    return true;
  }
}
