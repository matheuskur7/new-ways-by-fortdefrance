import { Inject, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CardFeesRepository } from './card-fees.repository.js';
import { catalogResponseSchema } from './dto/card-fees.dto.js';
import { toProviderResponse, toGroupResponse, toRateResponse } from './card-fees.mapper.js';
import type { AuthSession } from '../auth/auth.factory.js';
import { OrganizationAccessService } from '../organization/organization-access.service.js';
import type { ProviderInput, GroupInput, RateInput } from './dto/card-fees.dto.js';
import type { CardFeeGroup } from './dto/card-fees.dto.js';

@Injectable()
export class CardFeesService {
  constructor(
    @Inject(CardFeesRepository) private readonly repository: CardFeesRepository,
    @Inject(OrganizationAccessService) private readonly organizations: OrganizationAccessService,
  ) {}

  async findAll(session: AuthSession) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const groups = new Map<string, CardFeeGroup>();
    for (const row of await this.repository.findAll(organizationId)) {
      let group = groups.get(row.id);
      if (!group) {
        group = {
          id: row.id,
          provider: { id: row.providerId, name: row.providerName },
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

  async catalog(session: AuthSession) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const [providers, groups] = await Promise.all([
      this.repository.listProviders(organizationId),
      this.repository.listGroups(organizationId),
    ]);
    return catalogResponseSchema.parse({
      providers: providers.map(toProviderResponse),
      groups: groups.map(toGroupResponse),
    });
  }

  async saveProvider(data: ProviderInput, session: AuthSession, id?: string) {
    const organizationId = await this.organizations.requireManager(session);
    const result = await this.write(() => this.repository.saveProvider(organizationId, data, id));
    if (!result) throw new NotFoundException('Provedor não encontrado nesta empresa.');
    return toProviderResponse(result);
  }

  async saveGroup(data: GroupInput, session: AuthSession, id?: string) {
    const organizationId = await this.organizations.requireManager(session);
    if (!(await this.repository.findProvider(organizationId, data.providerId)))
      throw new NotFoundException('Provedor não encontrado nesta empresa.');
    const result = await this.write(() => this.repository.saveGroup(organizationId, data, id));
    if (!result) throw new NotFoundException('Grupo não encontrado nesta empresa.');
    return toGroupResponse(result);
  }

  async saveRate(groupId: string, data: RateInput, session: AuthSession, id?: string) {
    const organizationId = await this.organizations.requireManager(session);
    const result = await this.write(() =>
      this.repository.saveRate(organizationId, groupId, data, id),
    );
    if (!result) throw new NotFoundException('Grupo ou taxa não encontrado nesta empresa.');
    return toRateResponse(result);
  }

  async reorderGroups(providerId: string, groupIds: string[], session: AuthSession) {
    const organizationId = await this.organizations.requireManager(session);
    const result = await this.repository.reorderGroups(organizationId, providerId, groupIds);

    if (result === 'not-found')
      throw new NotFoundException('Provedor não encontrado nesta empresa.');
    if (result === 'stale')
      throw new ConflictException('A lista de grupos mudou. Atualize a página e tente novamente.');
  }

  async removeProvider(id: string, session: AuthSession) {
    const organizationId = await this.organizations.requireManager(session);

    if (await this.repository.hasProviderGroups(organizationId, id)) {
      throw new ConflictException('Remova os grupos deste provedor antes de removê-lo.');
    }

    try {
      const result = await this.repository.removeProvider(organizationId, id);
      if (!result) throw new NotFoundException('Provedor não encontrado nesta empresa.');
    } catch (error) {
      const cause = error instanceof Error && error.cause ? error.cause : error;
      if (
        typeof cause === 'object' &&
        cause !== null &&
        'code' in cause &&
        cause.code === '23503'
      ) {
        throw new ConflictException('Remova os grupos deste provedor antes de removê-lo.');
      }
      throw error;
    }
  }

  async removeGroup(id: string, session: AuthSession) {
    const organizationId = await this.organizations.requireManager(session);
    const result = await this.repository.removeGroup(organizationId, id);

    if (!result) throw new NotFoundException('Grupo não encontrado nesta empresa.');
  }

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const cause = error instanceof Error && error.cause ? error.cause : error;
      if (typeof cause === 'object' && cause !== null && 'code' in cause) {
        if (cause.code === '23505')
          throw new ConflictException('Nome de provedor ou parcelamento já cadastrado.');
        if (cause.code === '23503')
          throw new NotFoundException('Provedor ou grupo não encontrado nesta empresa.');
      }
      throw error;
    }
  }
}
