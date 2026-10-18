import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { Environment } from '../config/env.js';
import { DatabaseService } from './database.service.js';
import { account, user } from './schemas/auth.schema.js';

const seedSchema = z.object({
  name: z.string().trim().min(1),
  email: z.email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
});

@Injectable()
export class AdminSeedService {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<Environment, true>,
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async run(): Promise<boolean> {
    const credentials = seedSchema.parse({
      name: this.config.get('ADMIN_USER_NAME', { infer: true }),
      email: this.config.get('ADMIN_USER_EMAIL', { infer: true }),
      password: this.config.get('ADMIN_USER_PASSWORD', { infer: true }),
    });
    const password = await hashPassword(credentials.password);

    return this.database.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(user)
        .values({
          id: randomUUID(),
          name: credentials.name,
          email: credentials.email,
        })
        .onConflictDoNothing({ target: user.email })
        .returning({ id: user.id });
      if (!created) return false;

      await tx.insert(account).values({
        id: randomUUID(),
        userId: created.id,
        accountId: created.id,
        providerId: 'credential',
        password,
        updatedAt: new Date(),
      });
      return true;
    });
  }
}
