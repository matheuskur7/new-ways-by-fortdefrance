import { Prisma } from '../../../../src/generated/prisma/client.js';
import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';
import { CardFeesRepository } from '../../../../src/modules/card-fees/card-fees.repository.js';
import { CardFeesService } from '../../../../src/modules/card-fees/card-fees.service.js';

function setup(groups: unknown[]) {
  const findMany = vi.fn().mockResolvedValue(groups);
  const prisma = { cardFeeGroup: { findMany } };
  const repository = new CardFeesRepository(prisma as unknown as PrismaService);
  return { findMany, service: new CardFeesService(repository) };
}

describe('CardFeesService', () => {
  it('serializes decimal percentages with two digits and preserves group metadata', async () => {
    const { findMany, service } = setup([
      {
        id: 'group',
        name: 'Visa / Mastercard',
        channel: 'Presencial',
        logoSvg: null,
        rates: [
          { installments: 1, ratePercent: new Prisma.Decimal('0') },
          { installments: 2, ratePercent: new Prisma.Decimal('3.94') },
          { installments: 3, ratePercent: new Prisma.Decimal('5.8') },
        ],
      },
    ]);
    expect(await service.findAll()).toEqual([
      {
        id: 'group',
        name: 'Visa / Mastercard',
        channel: 'Presencial',
        logoSvg: null,
        rates: [
          { installments: 1, ratePercent: '0.00' },
          { installments: 2, ratePercent: '3.94' },
          { installments: 3, ratePercent: '5.80' },
        ],
      },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        select: expect.objectContaining({
          rates: {
            orderBy: { installments: 'asc' },
            select: { installments: true, ratePercent: true },
          },
        }),
      }),
    );
  });

  it('returns an empty catalog when no fees are registered', async () => {
    const { service } = setup([]);
    expect(await service.findAll()).toEqual([]);
  });
});
