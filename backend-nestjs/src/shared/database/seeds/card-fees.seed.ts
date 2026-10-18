import type { DatabaseService } from '../database.service.js';
import { cardFeeGroups, cardFees } from '../schemas/card-fees.schema.js';
import { initialCardFeeGroups } from './card-fees.data.js';

export async function seedCardFees(database: DatabaseService): Promise<number> {
  return database.db.transaction(async (tx) => {
    let created = 0;
    for (const { rates, ...values } of initialCardFeeGroups) {
      const [group] = await tx
        .insert(cardFeeGroups)
        .values(values)
        .onConflictDoNothing({ target: cardFeeGroups.seedKey })
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
