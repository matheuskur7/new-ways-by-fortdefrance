import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { InitialSeedService } from './shared/database/initial-seed.service.js';

const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
try {
  const changed = await app.get(InitialSeedService).run();
  console.info(
    changed
      ? 'Seed inicial aplicado: conta, empresa e vínculo garantidos.'
      : 'Seed inicial já aplicado; nenhuma alteração realizada.',
  );
} catch {
  console.error(
    'Falha no seed. Confira INITIAL_USER_*, INITIAL_ORGANIZATION_*, a conexão e as migrações do banco.',
  );
  process.exitCode = 1;
} finally {
  await app.close();
}
