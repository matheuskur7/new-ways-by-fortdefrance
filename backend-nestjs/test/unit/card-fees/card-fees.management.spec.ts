import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CardFeesService } from '../../../src/modules/card-fees/card-fees.service.js';
import type { CardFeesRepository } from '../../../src/modules/card-fees/card-fees.repository.js';
import type { OrganizationAccessService } from '../../../src/modules/organization/organization-access.service.js';
import {
  brandInputSchema,
  providerInputSchema,
  taxRateSchema,
} from '../../../src/modules/card-fees/dto/card-fees.dto.js';
import { authSession } from '../../fixtures/auth.js';

const id = '019a1234-5678-7000-8000-123456789abc';
const createdAt = new Date('2026-01-01T10:00:00.000Z');
const updatedAt = new Date('2026-02-01T12:30:00.000Z');
const dates = { createdAt, updatedAt };
const isoDates = { createdAt: createdAt.toISOString(), updatedAt: updatedAt.toISOString() };
const logo = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
const provider = { name: 'InfinitePay', logo };
const data = {
  providerId: id,
  name: 'Visa',
  channel: 'Presencial',
  displayOrder: 10,
  logo: null,
  rates: [{ installments: 18, ratePercent: '3.94' }],
};
function setup() {
  const repository = {
    saveProvider: vi.fn(),
    reorderBrands: vi.fn().mockResolvedValue('ok'),
    removeProvider: vi.fn(),
    hasProviderBrands: vi.fn().mockResolvedValue(false),
    removeBrand: vi.fn(),
    findProvider: vi.fn(),
    saveBrand: vi.fn(),
    listProviders: vi.fn().mockResolvedValue([]),
    listBrands: vi.fn().mockResolvedValue([]),
  };
  const access = {
    requireActiveOrganization: vi.fn().mockResolvedValue('org-test'),
    requireManager: vi.fn().mockResolvedValue('org-test'),
  };
  const service = new CardFeesService(
    repository as unknown as CardFeesRepository,
    access as unknown as OrganizationAccessService,
  );
  return { repository, access, service };
}

describe('Gerenciamento de taxas por empresa', () => {
  it('consulta o catálogo da empresa validada e inclui provedores sem bandeiras', async () => {
    const { repository, service } = setup();
    repository.listProviders.mockResolvedValue([{ id, ...provider, ...dates }]);
    await expect(service.catalog(authSession)).resolves.toEqual({
      providers: [{ id, ...provider, ...isoDates }],
      brands: [],
    });
    expect(repository.listProviders).toHaveBeenCalledWith('org-test');
    expect(repository.listBrands).toHaveBeenCalledWith('org-test');
  });
  it('não persiste dados sem permissão atual', async () => {
    const { repository, access, service } = setup();
    access.requireManager.mockRejectedValue(new ForbiddenException());
    await expect(service.saveBrand(data, authSession)).rejects.toThrow(ForbiddenException);
    expect(repository.findProvider).not.toHaveBeenCalled();
    expect(repository.saveBrand).not.toHaveBeenCalled();
  });
  it('não aceita provedor de outra empresa', async () => {
    const { repository, service } = setup();
    repository.findProvider.mockResolvedValue(undefined);
    await expect(service.saveBrand(data, authSession)).rejects.toThrow(NotFoundException);
    expect(repository.findProvider).toHaveBeenCalledWith('org-test', id);
    expect(repository.saveBrand).not.toHaveBeenCalled();
  });
  it('grava a bandeira com as taxas ordenadas em JSON sem aceitar empresa no DTO', async () => {
    const { repository, service } = setup();
    const rates = [
      { installments: 2, ratePercent: '4.46' },
      { installments: 1, ratePercent: '0.00' },
    ];
    repository.findProvider.mockResolvedValue({ id });
    repository.saveBrand.mockImplementation(async (_org: string, values: typeof data) => ({
      ...values,
      ...dates,
      id,
    }));
    const result = await service.saveBrand({ ...data, rates }, authSession);
    const sorted = [rates[1], rates[0]];
    expect(repository.saveBrand).toHaveBeenCalledWith(
      'org-test',
      { ...data, rates: sorted },
      undefined,
    );
    expect(result.rates).toEqual(sorted);
    expect(brandInputSchema.safeParse({ ...data, organizationId: 'foreign' }).success).toBe(false);
  });
  it('não edita IDs de outra empresa e retorna conflito de unicidade', async () => {
    const { repository, service } = setup();
    await expect(service.saveProvider(provider, authSession, id)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.saveProvider).toHaveBeenCalledWith('org-test', provider, id);
    repository.findProvider.mockResolvedValue({ id });
    await expect(service.saveBrand(data, authSession, id)).rejects.toThrow(NotFoundException);
    repository.saveProvider.mockRejectedValue(new Error('db', { cause: { code: '23505' } }));
    await expect(service.saveProvider(provider, authSession)).rejects.toThrow(ConflictException);
  });
  it('aceita quantidades acima de 12 e rejeita parcelas/percentuais inválidos ou duplicados', () => {
    for (const count of [3, 5, 9, 11, 18, 24]) {
      const rates = Array.from({ length: count }, (_, i) => ({
        installments: i + 1,
        ratePercent: '3.94',
      }));
      expect(brandInputSchema.safeParse({ ...data, rates }).success).toBe(true);
    }
    expect(brandInputSchema.safeParse({ ...data, rates: [] }).success).toBe(false);
    expect(
      brandInputSchema.safeParse({ ...data, rates: [data.rates[0], data.rates[0]] }).success,
    ).toBe(false);
    for (const input of [
      { installments: 0, ratePercent: '1.00' },
      { installments: 32768, ratePercent: '1.00' },
      { installments: 1, ratePercent: '100.00' },
      { installments: 1, ratePercent: '1.999' },
      { installments: 1, ratePercent: '1.00', id },
    ])
      expect(taxRateSchema.safeParse(input).success).toBe(false);
  });
  it('aceita somente logos SVG ou nulos para provedores e bandeiras', () => {
    expect(providerInputSchema.safeParse({ name: 'P', logo: null }).success).toBe(true);
    expect(providerInputSchema.safeParse({ name: 'P', logo }).success).toBe(true);
    expect(providerInputSchema.safeParse({ name: 'P' }).success).toBe(false);
    for (const invalid of ['https://example.com/logo.png', '<img src="x">'])
      expect(brandInputSchema.safeParse({ ...data, logo: invalid }).success).toBe(false);
  });
});

describe('Respostas com registros completos do Drizzle', () => {
  const audit = { organizationId: 'org-test', ...dates };
  const providerRow = { ...audit, id, ...provider };
  const brandRow = { ...audit, ...data, id };
  const expectedBrand = { ...data, id, ...isoDates };

  it('retorna o catálogo sem campos internos', async () => {
    const { repository, service } = setup();
    repository.listProviders.mockResolvedValue([providerRow]);
    repository.listBrands.mockResolvedValue([brandRow]);

    await expect(service.catalog(authSession)).resolves.toEqual({
      providers: [{ id, ...provider, ...isoDates }],
      brands: [expectedBrand],
    });
  });

  it('retorna os contratos públicos após criar e editar provedores e bandeiras', async () => {
    const { repository, service } = setup();
    repository.findProvider.mockResolvedValue(providerRow);
    repository.saveProvider.mockResolvedValue(providerRow);
    repository.saveBrand.mockResolvedValue(brandRow);

    for (const resourceId of [undefined, id]) {
      await expect(service.saveProvider(provider, authSession, resourceId)).resolves.toEqual({
        id,
        ...provider,
        ...isoDates,
      });
      await expect(service.saveBrand(data, authSession, resourceId)).resolves.toEqual(
        expectedBrand,
      );
    }
  });
});

describe('Remoção de provedores e bandeiras', () => {
  it('valida permissão e restringe a remoção à empresa da sessão', async () => {
    const { repository, service } = setup();
    repository.removeProvider.mockResolvedValue({ id });
    repository.removeBrand.mockResolvedValue({ id });

    await service.removeProvider(id, authSession);
    await service.removeBrand(id, authSession);
    expect(repository.removeProvider).toHaveBeenCalledWith('org-test', id);
    expect(repository.removeBrand).toHaveBeenCalledWith('org-test', id);
  });

  it('rejeita remoção de registros ausentes e de outras empresas', async () => {
    const { service } = setup();

    await expect(service.removeProvider(id, authSession)).rejects.toThrow(NotFoundException);
    await expect(service.removeBrand(id, authSession)).rejects.toThrow(NotFoundException);
  });

  it('bloqueia membros comuns e vínculos removidos antes da persistência', async () => {
    const { access, repository, service } = setup();
    access.requireManager.mockRejectedValue(new ForbiddenException());

    await expect(service.removeProvider(id, authSession)).rejects.toThrow(ForbiddenException);
    await expect(service.removeBrand(id, authSession)).rejects.toThrow(ForbiddenException);
    expect(repository.removeProvider).not.toHaveBeenCalled();
    expect(repository.removeBrand).not.toHaveBeenCalled();
  });

  it('preserva provedores que possuem bandeiras vinculadas', async () => {
    const { repository, service } = setup();
    repository.removeProvider.mockRejectedValue(new Error('db', { cause: { code: '23503' } }));

    await expect(service.removeProvider(id, authSession)).rejects.toThrow(ConflictException);
  });

  it('avisa sobre bandeiras vinculadas antes de tentar excluir o provedor', async () => {
    const { repository, service } = setup();
    repository.hasProviderBrands.mockResolvedValue(true);

    await expect(service.removeProvider(id, authSession)).rejects.toThrow(
      'Remova as bandeiras deste provedor antes de removê-lo.',
    );
    expect(repository.hasProviderBrands).toHaveBeenCalledWith('org-test', id);
    expect(repository.removeProvider).not.toHaveBeenCalled();
  });
});

describe('Ordenação de bandeiras', () => {
  it('salva a ordem na empresa validada e bloqueia alterações sem permissão', async () => {
    const { service, repository, access } = setup();
    await service.reorderBrands(id, [id], authSession);
    expect(repository.reorderBrands).toHaveBeenCalledWith('org-test', id, [id]);
    access.requireManager.mockRejectedValue(new ForbiddenException());
    await expect(service.reorderBrands(id, [id], authSession)).rejects.toThrow(ForbiddenException);
    expect(repository.reorderBrands).toHaveBeenCalledTimes(1);
  });

  it('rejeita provedor externo e listas divergentes sem confirmar a ordenação', async () => {
    const { service, repository } = setup();
    repository.reorderBrands.mockResolvedValue('not-found');
    await expect(service.reorderBrands(id, [id], authSession)).rejects.toThrow(NotFoundException);
    repository.reorderBrands.mockResolvedValue('stale');
    await expect(service.reorderBrands(id, [id], authSession)).rejects.toThrow(ConflictException);
  });
});
