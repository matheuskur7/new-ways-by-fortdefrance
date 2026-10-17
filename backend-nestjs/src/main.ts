import 'reflect-metadata';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { setupHttp } from './shared/config/http.js';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { Environment } from './shared/config/env.js';
import { setupDocumentation } from './shared/config/documentation.js';

const app = await NestFactory.create<NestExpressApplication>(AppModule, {
  bodyParser: false,
});
const config = app.get<ConfigService<Environment, true>>(ConfigService);
app.enableShutdownHooks();
setupHttp(app);
setupDocumentation(app);
await app.listen(config.get('PORT', { infer: true }));
