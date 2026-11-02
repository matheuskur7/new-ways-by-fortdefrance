import { Injectable } from '@nestjs/common';
import { CardFeesRepository } from './card-fees.repository.js';
import type { GetCardFeeGroupResponseDto } from './dto/get-card-fee-group.response.dto.js';

@Injectable()
export class CardFeesService {
  constructor(private readonly repository: CardFeesRepository) {}

  async findAll(): Promise<GetCardFeeGroupResponseDto[]> {
    const groups = await this.repository.findAll();
    return groups.map((group) => ({
      ...group,
      rates: group.rates.map((rate) => ({
        installments: rate.installments,
        ratePercent: rate.ratePercent.toFixed(2),
      })),
    }));
  }
}
