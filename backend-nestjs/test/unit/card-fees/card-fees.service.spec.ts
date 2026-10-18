import { describe, expect, it, vi } from 'vitest';
import { CardFeesService } from '../../../src/modules/card-fees/card-fees.service.js';
import type { CardFeesRepository } from '../../../src/modules/card-fees/card-fees.repository.js';

describe('CardFeesService', () => {
  it('agrupa taxas mantendo ordem, precisão e grupos sem taxas', async () => {
    const group = {
      id: 'group-a',
      name: 'Visa / Mastercard',
      channel: 'Presencial',
      logoSvg: null,
    };
    const repository = {
      findAll: vi.fn().mockResolvedValue([
        { ...group, installments: 1, ratePercent: '0.00' },
        { ...group, installments: 2, ratePercent: '3.94' },
        { ...group, id: 'group-b', installments: null, ratePercent: null },
      ]),
    };
    const service = new CardFeesService(repository as unknown as CardFeesRepository);
    expect(await service.findAll()).toEqual([
      {
        ...group,
        rates: [
          { installments: 1, ratePercent: '0.00' },
          { installments: 2, ratePercent: '3.94' },
        ],
      },
      { ...group, id: 'group-b', rates: [] },
    ]);
  });
  it('retorna lista vazia sem grupos cadastrados', async () => {
    const repository = { findAll: vi.fn().mockResolvedValue([]) };
    await expect(
      new CardFeesService(repository as unknown as CardFeesRepository).findAll(),
    ).resolves.toEqual([]);
  });
});
