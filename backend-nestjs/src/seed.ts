import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { AdminSeedService } from './shared/database/admin-seed.service.js';

const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
try {
  const created = await app.get(AdminSeedService).run();
  console.info(
    created ? 'Conta inicial criada.' : 'Conta inicial já existe; nenhuma alteração realizada.',
  );
} catch {
  console.error(
    'Falha no seed. Confira as variáveis ADMIN_USER_*, a conexão e as migrações do banco.',
  );
  process.exitCode = 1;
} finally {
  await app.close();
}
