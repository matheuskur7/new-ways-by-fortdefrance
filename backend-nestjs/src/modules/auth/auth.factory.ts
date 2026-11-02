import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import type { Environment } from '../../shared/config/env.js';
import type { DatabaseService } from '../../shared/database/database.service.js';
import * as schema from '../../shared/database/schemas/index.js';
import type { AuthEmailSender } from './auth-emails.service.js';
import { createAuthOptions } from './auth.options.js';

export function createAuth(
  config: ConfigService<Environment, true>,
  database: DatabaseService['db'],
  emails: AuthEmailSender,
) {
  return betterAuth({
    ...createAuthOptions(config, emails),
    database: drizzleAdapter(database, {
      provider: 'pg',
      schema,
      transaction: true,
    }),
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Auth['$Infer']['Session'];
