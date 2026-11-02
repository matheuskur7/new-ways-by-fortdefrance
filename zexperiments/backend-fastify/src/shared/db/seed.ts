import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { createAuth } from '../../modules/auth/auth.config.js';
import {
  getSeedUserInput,
  seedUser,
} from '../../modules/auth/seeds/seed-user.js';
import { seedCardFees } from '../../modules/card-fees/seeds/seed-card-fees.js';

const config = new ConfigService();
const input = getSeedUserInput(config);
const prisma = new PrismaService(config);
const email = new EmailService(config);

try {
  const result = await seedUser(
    prisma,
    createAuth(prisma, config, email),
    input,
  );
  console.info(
    result.created
      ? 'Usuário inicial criado.'
      : 'Usuário inicial já existe; dados e senha preservados.',
  );
  const groups = await seedCardFees(prisma);
  console.info(
    `${groups.length} grupos de taxas disponíveis; taxas existentes preservadas.`,
  );
} finally {
  await email.onModuleDestroy();
  await prisma.$disconnect();
}
