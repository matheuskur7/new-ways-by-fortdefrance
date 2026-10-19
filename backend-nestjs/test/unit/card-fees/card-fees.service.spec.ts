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
    const provider = { id: 'provider-a', name: 'InfinitePay' };
    const repository = {
      findAll: vi.fn().mockResolvedValue([
        {
          ...group,
          providerId: provider.id,
          providerName: provider.name,
          installments: 1,
          ratePercent: '0.00',
        },
        {
          ...group,
          providerId: provider.id,
          providerName: provider.name,
          installments: 2,
          ratePercent: '3.94',
        },
        {
          ...group,
          providerId: provider.id,
          providerName: provider.name,
          id: 'group-b',
          installments: null,
          ratePercent: null,
        },
      ]),
    };
    const service = new CardFeesService(repository as unknown as CardFeesRepository);
    expect(await service.findAll()).toEqual([
      {
        ...group,
        provider,
        rates: [
          { installments: 1, ratePercent: '0.00' },
          { installments: 2, ratePercent: '3.94' },
        ],
      },
      { ...group, provider, id: 'group-b', rates: [] },
    ]);
  });
  it('retorna lista vazia sem grupos cadastrados', async () => {
    const repository = { findAll: vi.fn().mockResolvedValue([]) };
    await expect(
      new CardFeesService(repository as unknown as CardFeesRepository).findAll(),
    ).resolves.toEqual([]);
  });
  it('mantém grupos com o mesmo nome separados por provedor', async () => {
    const common = {
      name: 'Visa / Mastercard',
      channel: 'Presencial',
      logoSvg: null,
      installments: 2,
      ratePercent: '3.94',
    };
    const repository = {
      findAll: vi.fn().mockResolvedValue([
        { ...common, id: 'group-a', providerId: 'provider-a', providerName: 'InfinitePay' },
        {
          ...common,
          id: 'group-b',
          providerId: 'provider-b',
          providerName: 'Outro provedor',
          ratePercent: '5.00',
        },
      ]),
    };
    const groups = await new CardFeesService(repository as unknown as CardFeesRepository).findAll();
    expect(groups).toHaveLength(2);
    expect(groups[0]?.provider.name).toBe('InfinitePay');
    expect(groups[1]?.provider.name).toBe('Outro provedor');
    expect(groups[1]?.rates).toEqual([{ installments: 2, ratePercent: '5.00' }]);
  });
});
