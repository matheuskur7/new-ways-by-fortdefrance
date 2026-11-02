import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { CardFeesService } from '../../../src/modules/card-fees/card-fees.service.js';
import type { CardFeesRepository } from '../../../src/modules/card-fees/card-fees.repository.js';
import type { OrganizationAccessService } from '../../../src/modules/organization/organization-access.service.js';
import {
  groupInputSchema,
  rateInputSchema,
} from '../../../src/modules/card-fees/dto/card-fees.dto.js';
import { authSession } from '../../fixtures/auth.js';

const id = '019a1234-5678-7000-8000-123456789abc';
const data = {
  providerId: id,
  name: 'Visa',
  channel: 'Presencial',
  displayOrder: 10,
  logoSvg: null,
  rates: [{ installments: 18, ratePercent: '3.94' }],
};
function setup() {
  const repository = {
    saveProvider: vi.fn(),
    reorderGroups: vi.fn().mockResolvedValue('ok'),
    removeProvider: vi.fn(),
    hasProviderGroups: vi.fn().mockResolvedValue(false),
    removeGroup: vi.fn(),
    findProvider: vi.fn(),
    saveGroup: vi.fn(),
    saveRate: vi.fn(),
    listProviders: vi.fn().mockResolvedValue([]),
    listGroups: vi.fn().mockResolvedValue([]),
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
  it('consulta o catálogo da empresa validada e inclui provedores sem grupos', async () => {
    const { repository, service } = setup();
    repository.listProviders.mockResolvedValue([{ id, name: 'Provedor' }]);
    await expect(service.catalog(authSession)).resolves.toEqual({
      providers: [{ id, name: 'Provedor' }],
      groups: [],
    });
    expect(repository.listProviders).toHaveBeenCalledWith('org-test');
    expect(repository.listGroups).toHaveBeenCalledWith('org-test');
  });
  it('não persiste dados sem permissão atual', async () => {
    const { repository, access, service } = setup();
    access.requireManager.mockRejectedValue(new ForbiddenException());
    await expect(service.saveGroup(data, authSession)).rejects.toThrow(ForbiddenException);
    expect(repository.findProvider).not.toHaveBeenCalled();
    expect(repository.saveGroup).not.toHaveBeenCalled();
  });
  it('não aceita provedor de outra empresa', async () => {
    const { repository, service } = setup();
    repository.findProvider.mockResolvedValue(undefined);
    await expect(service.saveGroup(data, authSession)).rejects.toThrow(NotFoundException);
    expect(repository.findProvider).toHaveBeenCalledWith('org-test', id);
    expect(repository.saveGroup).not.toHaveBeenCalled();
  });
  it('cria grupo e taxas na empresa da sessão sem aceitar empresa no DTO', async () => {
    const { repository, service } = setup();
    repository.findProvider.mockResolvedValue({ id });
    repository.saveGroup.mockResolvedValue({ ...data, id, rates: [{ ...data.rates[0], id }] });
    await service.saveGroup(data, authSession);
    expect(repository.saveGroup).toHaveBeenCalledWith('org-test', data, undefined);
    expect(groupInputSchema.safeParse({ ...data, organizationId: 'foreign' }).success).toBe(false);
  });
  it('não edita IDs de outra empresa e retorna conflito de unicidade', async () => {
    const { repository, service } = setup();
    await expect(service.saveProvider({ name: 'Nome' }, authSession, id)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.saveProvider).toHaveBeenCalledWith('org-test', { name: 'Nome' }, id);
    repository.saveProvider.mockRejectedValue(new Error('db', { cause: { code: '23505' } }));
    await expect(service.saveProvider({ name: 'Nome' }, authSession)).rejects.toThrow(
      ConflictException,
    );
    await expect(service.saveRate(id, data.rates[0]!, authSession, id)).rejects.toThrow(
      NotFoundException,
    );
    expect(repository.saveRate).toHaveBeenCalledWith('org-test', id, data.rates[0], id);
  });
  it('aceita quantidades acima de 12 e rejeita parcelas/percentuais inválidos ou duplicados', () => {
    for (const count of [3, 5, 9, 11, 18, 24]) {
      const rates = Array.from({ length: count }, (_, i) => ({
        installments: i + 1,
        ratePercent: '3.94',
      }));
      expect(groupInputSchema.safeParse({ ...data, rates }).success).toBe(true);
    }
    expect(
      groupInputSchema.safeParse({ ...data, rates: [data.rates[0], data.rates[0]] }).success,
    ).toBe(false);
    for (const input of [
      { installments: 0, ratePercent: '1.00' },
      { installments: 32768, ratePercent: '1.00' },
      { installments: 1, ratePercent: '100.00' },
      { installments: 1, ratePercent: '1.999' },
    ])
      expect(rateInputSchema.safeParse(input).success).toBe(false);
  });
});

describe('Respostas com registros completos do Drizzle', () => {
  const audit = { organizationId: 'org-test', createdAt: new Date(), updatedAt: new Date() };
  const provider = { ...audit, id, name: 'Provedor' };
  const rate = {
    organizationId: 'org-test',
    groupId: id,
    id,
    installments: 18,
    ratePercent: '3.94',
  };
  const group = { ...audit, ...data, id, seedKey: 'VISA', rates: [rate] };
  const expectedRate = { id, installments: 18, ratePercent: '3.94' };
  const expectedGroup = { ...data, id, rates: [expectedRate] };

  it('retorna o catálogo sem campos internos de grupos e taxas', async () => {
    const { repository, service } = setup();
    repository.listProviders.mockResolvedValue([provider]);
    repository.listGroups.mockResolvedValue([group]);

    await expect(service.catalog(authSession)).resolves.toEqual({
      providers: [{ id, name: 'Provedor' }],
      groups: [expectedGroup],
    });
  });

  it('retorna os contratos públicos após criar e editar os três recursos', async () => {
    const { repository, service } = setup();
    repository.findProvider.mockResolvedValue(provider);
    repository.saveProvider.mockResolvedValue(provider);
    repository.saveGroup.mockResolvedValue(group);
    repository.saveRate.mockResolvedValue(rate);

    for (const resourceId of [undefined, id]) {
      await expect(
        service.saveProvider({ name: 'Provedor' }, authSession, resourceId),
      ).resolves.toEqual({ id, name: 'Provedor' });
      await expect(service.saveGroup(data, authSession, resourceId)).resolves.toEqual(
        expectedGroup,
      );
      await expect(service.saveRate(id, data.rates[0]!, authSession, resourceId)).resolves.toEqual(
        expectedRate,
      );
    }
  });
});

describe('Remoção de provedores e grupos', () => {
  it('valida permissão e restringe a remoção à empresa da sessão', async () => {
    const { repository, service } = setup();
    repository.removeProvider.mockResolvedValue({ id });
    repository.removeGroup.mockResolvedValue({ id });

    await service.removeProvider(id, authSession);
    await service.removeGroup(id, authSession);
    expect(repository.removeProvider).toHaveBeenCalledWith('org-test', id);
    expect(repository.removeGroup).toHaveBeenCalledWith('org-test', id);
  });

  it('rejeita remoção de registros ausentes e de outras empresas', async () => {
    const { service } = setup();

    await expect(service.removeProvider(id, authSession)).rejects.toThrow(NotFoundException);
    await expect(service.removeGroup(id, authSession)).rejects.toThrow(NotFoundException);
  });

  it('bloqueia membros comuns e vínculos removidos antes da persistência', async () => {
    const { access, repository, service } = setup();
    access.requireManager.mockRejectedValue(new ForbiddenException());

    await expect(service.removeProvider(id, authSession)).rejects.toThrow(ForbiddenException);
    await expect(service.removeGroup(id, authSession)).rejects.toThrow(ForbiddenException);
    expect(repository.removeProvider).not.toHaveBeenCalled();
    expect(repository.removeGroup).not.toHaveBeenCalled();
  });

  it('preserva provedores que possuem grupos vinculados', async () => {
    const { repository, service } = setup();
    repository.removeProvider.mockRejectedValue(new Error('db', { cause: { code: '23503' } }));

    await expect(service.removeProvider(id, authSession)).rejects.toThrow(ConflictException);
  });
});

it('avisa sobre grupos vinculados antes de tentar excluir o provedor', async () => {
  const { repository, service } = setup();
  repository.hasProviderGroups.mockResolvedValue(true);

  await expect(service.removeProvider(id, authSession)).rejects.toThrow(
    'Remova os grupos deste provedor antes de removê-lo.',
  );
  expect(repository.hasProviderGroups).toHaveBeenCalledWith('org-test', id);
  expect(repository.removeProvider).not.toHaveBeenCalled();
});

describe('Ordenação de grupos', () => {
  it('salva a ordem na empresa validada e bloqueia alterações sem permissão', async () => {
    const { service, repository, access } = setup();
    await service.reorderGroups(id, [id], authSession);
    expect(repository.reorderGroups).toHaveBeenCalledWith('org-test', id, [id]);
    access.requireManager.mockRejectedValue(new ForbiddenException());
    await expect(service.reorderGroups(id, [id], authSession)).rejects.toThrow(ForbiddenException);
    expect(repository.reorderGroups).toHaveBeenCalledTimes(1);
  });

  it('rejeita provedor externo e listas divergentes sem confirmar a ordenação', async () => {
    const { service, repository } = setup();
    repository.reorderGroups.mockResolvedValue('not-found');
    await expect(service.reorderGroups(id, [id], authSession)).rejects.toThrow(NotFoundException);
    repository.reorderGroups.mockResolvedValue('stale');
    await expect(service.reorderGroups(id, [id], authSession)).rejects.toThrow(ConflictException);
  });
});
