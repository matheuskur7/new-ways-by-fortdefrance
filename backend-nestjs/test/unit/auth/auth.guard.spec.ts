import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthGuard } from '../../../src/modules/auth/auth.guard.js';
import { AuthService } from '../../../src/modules/auth/auth.service.js';
import { authSession } from '../../fixtures/auth.js';

describe('AuthGuard', () => {
  const authService = { getSession: vi.fn() };
  const guard = new AuthGuard(authService as unknown as AuthService);
  const request = {
    headers: { cookie: 'test-cookie' },
    authSession: undefined,
  };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    vi.resetAllMocks();
    request.authSession = undefined;
  });

  it('rejeita sessão ausente ou expirada', async () => {
    authService.getSession.mockResolvedValue(null);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(request.authSession).toBeUndefined();
  });

  it('atribui à requisição somente a sessão validada pelo Better Auth', async () => {
    authService.getSession.mockResolvedValue(authSession);
    expect(await guard.canActivate(context)).toBe(true);
    expect(authService.getSession).toHaveBeenCalledWith(request.headers);
    expect(request.authSession).toBe(authSession);
  });
});
