import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import type { Environment } from './shared/config/env.js';
import { setupDocumentation } from './shared/config/documentation.js';

const app = await NestFactory.create(AppModule);
const config = app.get<ConfigService<Environment, true>>(ConfigService);
app.enableShutdownHooks();
app.enableCors({ origin: config.get('FRONTEND_URL', { infer: true }) });
setupDocumentation(app);
await app.listen(config.get('PORT', { infer: true }));
