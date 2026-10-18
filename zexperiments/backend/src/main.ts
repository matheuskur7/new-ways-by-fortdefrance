import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { configureAuth } from './modules/auth/configure-auth.js';
import { AppModule } from './app.module.js';
import { AuthService } from './modules/auth/auth.service.js';
import { configureApplication } from './shared/http/configure-application.js';
import { configureAudit } from './shared/audit/configure-audit.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  app.enableShutdownHooks();
  const config = app.get(ConfigService);
  configureAudit(app, app.get(AuthService));
  configureAuth(
    app,
    app.get(AuthService).auth,
    config.getOrThrow<string>('FRONTEND_URL'),
  );
  configureApplication(app);
  await app.listen(config.get<number>('PORT') ?? 5000);
}
await bootstrap();
