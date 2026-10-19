import { eq } from 'drizzle-orm';
import type { DatabaseService } from '../database.service.js';
import { cardFeeProviders, cardFeeGroups, cardFees } from '../schemas/card-fees.schema.js';
import { initialCardFeeGroups, initialCardFeeProviderName } from './card-fees.data.js';

export async function seedCardFees(database: DatabaseService): Promise<number> {
  return database.db.transaction(async (tx) => {
    await tx
      .insert(cardFeeProviders)
      .values({ name: initialCardFeeProviderName })
      .onConflictDoNothing({ target: cardFeeProviders.name });
    const [provider] = await tx
      .select({ id: cardFeeProviders.id })
      .from(cardFeeProviders)
      .where(eq(cardFeeProviders.name, initialCardFeeProviderName))
      .limit(1);
    if (!provider) throw new Error('Provedor inicial de taxas não encontrado.');
    let created = 0;
    for (const { rates, ...values } of initialCardFeeGroups) {
      const [group] = await tx
        .insert(cardFeeGroups)
        .values({ ...values, providerId: provider.id })
        .onConflictDoNothing({ target: [cardFeeGroups.providerId, cardFeeGroups.seedKey] })
        .returning({ id: cardFeeGroups.id });
      if (!group) continue;
      await tx.insert(cardFees).values(
        rates.map((ratePercent, index) => ({
          groupId: group.id,
          installments: index + 1,
          ratePercent,
        })),
      );
      created++;
    }
    return created;
  });
}
