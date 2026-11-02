import type { AuthSession } from '../../../src/modules/auth/auth.factory.js';
import type { OrganizationAccessService } from '../../../src/modules/organization/organization-access.service.js';
import { describe, expect, it, vi } from 'vitest';
import { CardFeesService } from '../../../src/modules/card-fees/card-fees.service.js';
import type { CardFeesRepository } from '../../../src/modules/card-fees/card-fees.repository.js';

const session = {} as AuthSession;
const access = {
  requireActiveOrganization: vi.fn().mockResolvedValue('org-id'),
} as unknown as OrganizationAccessService;
const brandA = '019a1234-5678-7000-8000-123456789001';
const brandB = '019a1234-5678-7000-8000-123456789002';
const providerA = '019a1234-5678-7000-8000-123456789003';
const providerB = '019a1234-5678-7000-8000-123456789004';

function serviceWith(rows: unknown[]) {
  const repository = { findAll: vi.fn().mockResolvedValue(rows) };
  return new CardFeesService(repository as unknown as CardFeesRepository, access);
}

describe('CardFeesService', () => {
  it('retorna as taxas do JSON da bandeira ordenadas e com precisão exata', async () => {
    const service = serviceWith([
      {
        id: brandA,
        providerId: providerA,
        providerName: 'InfinitePay',
        providerLogo: '<svg></svg>',
        name: 'Visa / Mastercard',
        channel: 'Presencial',
        logo: null,
        rates: [
          { installments: 2, ratePercent: '3.94' },
          { installments: 1, ratePercent: '0.00' },
        ],
      },
    ]);
    expect(await service.findAll(session)).toEqual([
      {
        id: brandA,
        provider: { id: providerA, name: 'InfinitePay', logo: '<svg></svg>' },
        name: 'Visa / Mastercard',
        channel: 'Presencial',
        logo: null,
        rates: [
          { installments: 1, ratePercent: '0.00' },
          { installments: 2, ratePercent: '3.94' },
        ],
      },
    ]);
  });

  it('retorna lista vazia sem bandeiras cadastradas', async () => {
    await expect(serviceWith([]).findAll(session)).resolves.toEqual([]);
  });

  it('mantém bandeiras com o mesmo nome separadas por provedor', async () => {
    const common = {
      name: 'Visa / Mastercard',
      channel: 'Presencial',
      logo: null,
      providerLogo: null,
    };
    const brands = await serviceWith([
      {
        ...common,
        id: brandA,
        providerId: providerA,
        providerName: 'InfinitePay',
        rates: [{ installments: 2, ratePercent: '3.94' }],
      },
      {
        ...common,
        id: brandB,
        providerId: providerB,
        providerName: 'Outro provedor',
        rates: [{ installments: 2, ratePercent: '5.00' }],
      },
    ]).findAll(session);
    expect(brands).toHaveLength(2);
    expect(brands[0]?.provider.name).toBe('InfinitePay');
    expect(brands[1]?.provider.name).toBe('Outro provedor');
    expect(brands[1]?.rates).toEqual([{ installments: 2, ratePercent: '5.00' }]);
  });
});
