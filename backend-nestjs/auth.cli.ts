import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { createAuth } from './src/modules/auth/auth.factory.js';
import { validateEnv } from './src/shared/config/env.js';
import type { Environment } from './src/shared/config/env.js';
import * as schema from './src/shared/database/schemas/index.js';

const env = validateEnv(process.env);
// Pool lazy: gerar/verificar o schema não consulta nem aplica migrações no banco.
export const auth = createAuth(
  new ConfigService<Environment, true>(env),
  drizzle({ connection: env.DATABASE_URL, schema }),
);
