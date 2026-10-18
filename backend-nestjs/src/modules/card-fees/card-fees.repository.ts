import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../shared/database/database.service.js';
import { cardFeeGroups, cardFees } from '../../shared/database/schemas/card-fees.schema.js';
@Injectable()
export class CardFeesRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  findAll() {
    return this.database.db
      .select({
        id: cardFeeGroups.id,
        name: cardFeeGroups.name,
        channel: cardFeeGroups.channel,
        logoSvg: cardFeeGroups.logoSvg,
        installments: cardFees.installments,
        ratePercent: cardFees.ratePercent,
      })
      .from(cardFeeGroups)
      .leftJoin(cardFees, eq(cardFees.groupId, cardFeeGroups.id))
      .orderBy(
        asc(cardFeeGroups.displayOrder),
        asc(cardFeeGroups.name),
        asc(cardFees.installments),
      );
  }
}
