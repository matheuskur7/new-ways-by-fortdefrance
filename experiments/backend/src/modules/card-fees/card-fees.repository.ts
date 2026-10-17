import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/db/prisma.service.js';

@Injectable()
export class CardFeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.cardFeeGroup.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        channel: true,
        logoSvg: true,
        rates: {
          orderBy: { installments: 'asc' },
          select: { installments: true, ratePercent: true },
        },
      },
    });
  }
}
