import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Express } from 'express';
import { toNodeHandler } from 'better-auth/node';
import type { Auth } from './auth.config.js';

export function configureAuth(
  app: NestExpressApplication,
  auth: Pick<Auth, 'handler'>,
  frontendURL: string,
): void {
  app.enableCors({ origin: new URL(frontendURL).origin, credentials: true });
  // Better Auth must receive the raw request stream before Nest's body parsers.
  const expressApp: Express = app.getHttpAdapter().getInstance();
  expressApp.all('/api/auth/*path', toNodeHandler(auth));
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });
}
