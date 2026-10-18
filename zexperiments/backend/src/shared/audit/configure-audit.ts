import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import type { AuthService } from '../../modules/auth/auth.service.js';
import { runWithAuditActor } from './audit-context.js';
import { getRequestSession } from '../../modules/auth/request-session.js';

export function configureAudit(
  app: NestExpressApplication,
  auth: Pick<AuthService, 'getSession'>,
): void {
  app.use((request: Request, _response: Response, next: NextFunction) => {
    if (request.method === 'OPTIONS') {
      void runWithAuditActor(null, next).catch(next);
      return;
    }
    // Auth callbacks may write even on GET. Resolve identity before either HTTP handler.
    // Authorization and trusted-origin checks remain in Better Auth / AuthGuard.
    void getRequestSession(request, auth)
      .then((session) => runWithAuditActor(session?.user.id ?? null, next))
      .catch(next);
  });
}
