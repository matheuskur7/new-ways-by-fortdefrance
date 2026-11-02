import type { PrismaService } from '../../../../src/shared/db/prisma.service.js';
import {
  initialCardFees,
  initialCardFeeLogos,
  seedCardFees,
} from '../../../../src/modules/card-fees/seeds/seed-card-fees.js';

it('seeds three groups with 36 exact decimal rates and preserves existing groups', async () => {
  const upsert = vi.fn().mockResolvedValue({ id: 'group' });
  const transaction = vi.fn((queries: Promise<unknown>[]) =>
    Promise.all(queries),
  );
  const prisma = { cardFeeGroup: { upsert }, $transaction: transaction };
  await seedCardFees(prisma as unknown as PrismaService);
  await seedCardFees(prisma as unknown as PrismaService);
  expect(upsert).toHaveBeenCalledTimes(6);
  expect(transaction).toHaveBeenCalledTimes(2);
  for (const [index, [seedKey, rates]] of Object.entries(
    initialCardFees,
  ).entries()) {
    const call = upsert.mock.calls[index][0];
    expect(call.where).toEqual({ seedKey });
    expect(call.update).toEqual({});
    expect(call.create.logoSvg).toBe(
      initialCardFeeLogos[seedKey as keyof typeof initialCardFeeLogos],
    );
    expect(call.create.rates.create).toEqual(
      rates.map((ratePercent, i) => ({ installments: i + 1, ratePercent })),
    );
  }
});
