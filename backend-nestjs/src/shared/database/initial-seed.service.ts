import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hashPassword } from 'better-auth/crypto';
import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { initialSeedSchema } from '../config/env.js';
import type { Environment } from '../config/env.js';
import { DatabaseService } from './database.service.js';
import { account, user } from './schemas/auth.schema.js';
import { member, organization } from './schemas/organization.schema.js';

@Injectable()
export class InitialSeedService {
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService<Environment, true>,
    @Inject(DatabaseService) private readonly database: DatabaseService,
  ) {}

  async run(): Promise<boolean> {
    const initial = initialSeedSchema.parse({
      INITIAL_USER_NAME: this.config.get('INITIAL_USER_NAME', { infer: true }),
      INITIAL_USER_EMAIL: this.config.get('INITIAL_USER_EMAIL', { infer: true }),
      INITIAL_USER_PASSWORD: this.config.get('INITIAL_USER_PASSWORD', { infer: true }),
      INITIAL_ORGANIZATION_NAME: this.config.get('INITIAL_ORGANIZATION_NAME', { infer: true }),
      INITIAL_ORGANIZATION_SLUG: this.config.get('INITIAL_ORGANIZATION_SLUG', { infer: true }),
    });
    const password = await hashPassword(initial.INITIAL_USER_PASSWORD);

    return this.database.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(user)
        .values({
          id: randomUUID(),
          name: initial.INITIAL_USER_NAME,
          email: initial.INITIAL_USER_EMAIL,
        })
        .onConflictDoNothing({ target: user.email })
        .returning({ id: user.id });
      if (created) {
        await tx.insert(account).values({
          id: randomUUID(),
          userId: created.id,
          accountId: created.id,
          providerId: 'credential',
          password,
          updatedAt: new Date(),
        });
      }

      const [initialUser] = created
        ? [created]
        : await tx
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, initial.INITIAL_USER_EMAIL))
            .limit(1);
      if (!initialUser) throw new Error('Conta inicial não encontrada.');

      const slug = initial.INITIAL_ORGANIZATION_SLUG;
      const [createdOrganization] = await tx
        .insert(organization)
        .values({
          id: randomUUID(),
          name: initial.INITIAL_ORGANIZATION_NAME,
          slug,
          createdAt: new Date(),
        })
        .onConflictDoNothing({ target: organization.slug })
        .returning({ id: organization.id });

      // Serializa seeds concorrentes para não duplicar o vínculo da matriz.
      const [matrix] = await tx
        .select({ id: organization.id })
        .from(organization)
        .where(eq(organization.slug, slug))
        .limit(1)
        .for('update');
      if (!matrix) throw new Error('Empresa inicial não encontrada.');

      const [membership] = await tx
        .select({ id: member.id, role: member.role })
        .from(member)
        .where(and(eq(member.organizationId, matrix.id), eq(member.userId, initialUser.id)))
        .limit(1);
      if (!membership) {
        await tx.insert(member).values({
          id: randomUUID(),
          organizationId: matrix.id,
          userId: initialUser.id,
          role: 'owner',
          createdAt: new Date(),
        });
        return true;
      }

      const roles = membership.role.split(',').map((role) => role.trim());
      if (!roles.includes('owner')) {
        await tx
          .update(member)
          .set({ role: [...roles, 'owner'].join(',') })
          .where(
            and(
              eq(member.id, membership.id),
              eq(member.organizationId, matrix.id),
              eq(member.userId, initialUser.id),
            ),
          );
        return true;
      }

      return Boolean(created || createdOrganization);
    });
  }
}
