import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { DatabaseService } from '../../shared/database/database.service.js';
import {
  cardFeeProviders,
  cardFeeGroups,
  cardFees,
} from '../../shared/database/schemas/card-fees.schema.js';
@Injectable()
export class CardFeesRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}
  findAll() {
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
      .orderBy(
        asc(cardFeeProviders.name),
        asc(cardFeeProviders.id),
        asc(cardFeeGroups.displayOrder),
        asc(cardFeeGroups.name),
        asc(cardFees.installments),
      );
  }
}
