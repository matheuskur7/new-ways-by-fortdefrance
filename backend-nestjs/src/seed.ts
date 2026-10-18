import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { INestApplicationContext } from '@nestjs/common';
import { DatabaseService } from './shared/database/database.service.js';
import { SeedsModule } from './shared/database/seeds/seeds.module.js';
import { InitialSeedService } from './shared/database/seeds/initial-seed.service.js';
import { seedCardFees } from './shared/database/seeds/card-fees.seed.js';

let app: INestApplicationContext | undefined;
try {
  app = await NestFactory.createApplicationContext(SeedsModule, {
    logger: false,
    abortOnError: false,
  });
  // Todos os seeds são chamados aqui, em ordem, somente pelo comando db:seed.
  const initialChanged = await app.get(InitialSeedService).run();
  console.info(
    initialChanged ? 'Dados iniciais criados ou atualizados.' : 'Dados iniciais já cadastrados.',
  );
  const groupsCreated = await seedCardFees(app.get(DatabaseService));
  console.info(
    `Taxas de cartão: ${groupsCreated} grupo(s) criado(s); grupos existentes preservados.`,
  );
  console.info('Seeds concluídos.');
} catch {
  console.error(
    'Falha nos seeds. Confira o ambiente, INITIAL_USER_*, INITIAL_ORGANIZATION_*, a conexão e as migrações do banco.',
  );
  process.exitCode = 1;
} finally {
  await app?.close();
}
