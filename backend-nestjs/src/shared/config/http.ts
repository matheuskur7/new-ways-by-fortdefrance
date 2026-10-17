import type { Express } from 'express';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { toNodeHandler } from 'better-auth/node';
import { AuthService } from '../../modules/auth/auth.service.js';
import type { Environment } from './env.js';

export function setupHttp(app: NestExpressApplication) {
  const config = app.get<ConfigService<Environment, true>>(ConfigService);
  app.enableCors({
    origin: config.get('FRONTEND_URL', { infer: true }),
    credentials: true,
  });
  // Better Auth precisa consumir o corpo original antes dos parsers do Nest.
  const server = app.getHttpAdapter().getInstance() as Express;
  server.all('/api/auth/{*path}', toNodeHandler(app.get(AuthService).auth));
  app.useBodyParser('json');
  app.useBodyParser('urlencoded', { extended: true });
}
