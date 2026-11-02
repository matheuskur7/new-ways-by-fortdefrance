import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, notInArray, sql } from 'drizzle-orm';
import type { GroupInput, ProviderInput, RateInput } from './dto/card-fees.dto.js';
import { DatabaseService } from '../../shared/database/database.service.js';
import {
  cardFeeProviders,
  cardFeeGroups,
  cardFees,
} from '../../shared/database/schemas/card-fees.schema.js';

@Injectable()
export class CardFeesRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  findAll(organizationId: string) {
    return this.database.db
      .select({
        id: cardFeeGroups.id,
        providerId: cardFeeProviders.id,
        providerName: cardFeeProviders.name,
        name: cardFeeGroups.name,
        channel: cardFeeGroups.channel,
        logoSvg: cardFeeGroups.logoSvg,
        installments: cardFees.installments,
        ratePercent: cardFees.ratePercent,
      })
      .from(cardFeeGroups)
      .innerJoin(cardFeeProviders, eq(cardFeeGroups.providerId, cardFeeProviders.id))
      .leftJoin(cardFees, eq(cardFees.groupId, cardFeeGroups.id))
      .where(eq(cardFeeGroups.organizationId, organizationId))
      .orderBy(
        asc(cardFeeProviders.name),
        asc(cardFeeProviders.id),
        asc(cardFeeGroups.displayOrder),
        asc(cardFeeGroups.name),
        asc(cardFees.installments),
      );
  }

  listProviders(organizationId: string) {
    return this.database.db
      .select({ id: cardFeeProviders.id, name: cardFeeProviders.name })
      .from(cardFeeProviders)
      .where(eq(cardFeeProviders.organizationId, organizationId))
      .orderBy(asc(cardFeeProviders.name), asc(cardFeeProviders.id));
  }

  async findProvider(organizationId: string, id: string) {
    const [provider] = await this.database.db
      .select()
      .from(cardFeeProviders)
      .where(and(eq(cardFeeProviders.organizationId, organizationId), eq(cardFeeProviders.id, id)))
      .limit(1);

    return provider;
  }

  async saveProvider(organizationId: string, data: ProviderInput, id?: string) {
    const [provider] = id
      ? await this.database.db
          .update(cardFeeProviders)
          .set(data)
          .where(
            and(eq(cardFeeProviders.organizationId, organizationId), eq(cardFeeProviders.id, id)),
          )
          .returning()
      : await this.database.db
          .insert(cardFeeProviders)
          .values({ ...data, organizationId })
          .returning();

    return provider;
  }

  async listGroups(organizationId: string) {
    const groups = await this.database.db
      .select()
      .from(cardFeeGroups)
      .where(eq(cardFeeGroups.organizationId, organizationId))
      .orderBy(asc(cardFeeGroups.displayOrder), asc(cardFeeGroups.name), asc(cardFeeGroups.id));
    const rates = await this.database.db
      .select()
      .from(cardFees)
      .where(eq(cardFees.organizationId, organizationId))
      .orderBy(asc(cardFees.installments));
    const byGroup = new Map<string, typeof rates>();
    for (const rate of rates) {
      const values = byGroup.get(rate.groupId) ?? [];
      values.push(rate);
      byGroup.set(rate.groupId, values);
    }

    return groups.map((group) => ({ ...group, rates: byGroup.get(group.id) ?? [] }));
  }

  saveGroup(organizationId: string, data: GroupInput, id?: string) {
    const { rates, ...values } = data;
    return this.database.db.transaction(async (tx) => {
      const [group] = id
        ? await tx
            .update(cardFeeGroups)
            .set(values)
            .where(and(eq(cardFeeGroups.organizationId, organizationId), eq(cardFeeGroups.id, id)))
            .returning()
        : await tx
            .insert(cardFeeGroups)
            .values({ ...values, organizationId })
            .returning();

      if (!group) return undefined;

      // Serializa a alteração do grupo com alterações individuais das suas taxas.
      await tx.delete(cardFees).where(
        and(
          eq(cardFees.organizationId, organizationId),
          eq(cardFees.groupId, group.id),
          notInArray(
            cardFees.installments,
            rates.map((rate) => rate.installments),
          ),
        ),
      );
      const saved = await tx
        .insert(cardFees)
        .values(rates.map((rate) => ({ ...rate, organizationId, groupId: group.id })))
        .onConflictDoUpdate({
          target: [cardFees.groupId, cardFees.installments],
          set: { ratePercent: sql`excluded.rate_percent` },
        })
        .returning();

      return { ...group, rates: saved.sort((a, b) => a.installments - b.installments) };
    });
  }

  reorderGroups(organizationId: string, providerId: string, groupIds: string[]) {
    return this.database.db.transaction(async (tx) => {
      const [provider] = await tx
        .select({ id: cardFeeProviders.id })
        .from(cardFeeProviders)
        .where(
          and(
            eq(cardFeeProviders.organizationId, organizationId),
            eq(cardFeeProviders.id, providerId),
          ),
        )
        .for('update');
      if (!provider) return 'not-found' as const;

      const groups = await tx
        .select({ id: cardFeeGroups.id })
        .from(cardFeeGroups)
        .where(
          and(
            eq(cardFeeGroups.organizationId, organizationId),
            eq(cardFeeGroups.providerId, providerId),
          ),
        )
        .for('update');
      const ids = new Set(groupIds);
      if (groups.length !== groupIds.length || groups.some((group) => !ids.has(group.id)))
        return 'stale' as const;

      for (const [displayOrder, id] of groupIds.entries()) {
        await tx
          .update(cardFeeGroups)
          .set({ displayOrder })
          .where(
            and(
              eq(cardFeeGroups.organizationId, organizationId),
              eq(cardFeeGroups.providerId, providerId),
              eq(cardFeeGroups.id, id),
            ),
          );
      }

      return 'ok' as const;
    });
  }

  async hasProviderGroups(organizationId: string, providerId: string) {
    const [group] = await this.database.db
      .select({ id: cardFeeGroups.id })
      .from(cardFeeGroups)
      .where(
        and(
          eq(cardFeeGroups.organizationId, organizationId),
          eq(cardFeeGroups.providerId, providerId),
        ),
      )
      .limit(1);

    return Boolean(group);
  }

  async removeProvider(organizationId: string, id: string) {
    const [provider] = await this.database.db
      .delete(cardFeeProviders)
      .where(and(eq(cardFeeProviders.organizationId, organizationId), eq(cardFeeProviders.id, id)))
      .returning({ id: cardFeeProviders.id });

    return provider;
  }

  async removeGroup(organizationId: string, id: string) {
    const [group] = await this.database.db
      .delete(cardFeeGroups)
      .where(and(eq(cardFeeGroups.organizationId, organizationId), eq(cardFeeGroups.id, id)))
      .returning({ id: cardFeeGroups.id });

    return group;
  }

  saveRate(organizationId: string, groupId: string, data: RateInput, id?: string) {
    return this.database.db.transaction(async (tx) => {
      const [group] = await tx
        .select({ id: cardFeeGroups.id })
        .from(cardFeeGroups)
        .where(and(eq(cardFeeGroups.organizationId, organizationId), eq(cardFeeGroups.id, groupId)))
        .for('update');

      if (!group) return undefined;

      const [rate] = id
        ? await tx
            .update(cardFees)
            .set(data)
            .where(
              and(
                eq(cardFees.organizationId, organizationId),
                eq(cardFees.groupId, groupId),
                eq(cardFees.id, id),
              ),
            )
            .returning()
        : await tx
            .insert(cardFees)
            .values({ ...data, organizationId, groupId })
            .returning();

      return rate;
    });
  }
}
