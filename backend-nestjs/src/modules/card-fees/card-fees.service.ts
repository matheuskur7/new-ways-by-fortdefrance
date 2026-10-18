import { Inject, Injectable } from '@nestjs/common';
import { CardFeesRepository } from './card-fees.repository.js';
import type { CardFeeGroup } from './dto/card-fees.dto.js';
@Injectable()
export class CardFeesService {
  constructor(@Inject(CardFeesRepository) private readonly repository: CardFeesRepository) {}
  async findAll() {
    const groups = new Map<string, CardFeeGroup>();
    for (const row of await this.repository.findAll()) {
      let group = groups.get(row.id);
      if (!group) {
        group = {
          id: row.id,
          name: row.name,
          channel: row.channel,
          logoSvg: row.logoSvg,
          rates: [],
        };
        groups.set(row.id, group);
      }
      if (row.installments !== null && row.ratePercent !== null) {
        group.rates.push({ installments: row.installments, ratePercent: row.ratePercent });
      }
    }
    return [...groups.values()];
  }
}
