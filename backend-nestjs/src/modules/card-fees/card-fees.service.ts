import { Inject, Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CardFeesRepository } from './card-fees.repository.js';
import { catalogResponseSchema, taxBrandsSchema } from './dto/card-fees.dto.js';
import { toProviderResponse, toBrandResponse, toRates } from './card-fees.mapper.js';
import type { AuthSession } from '../auth/auth.factory.js';
import { OrganizationAccessService } from '../organization/organization-access.service.js';
import type { ProviderInput, BrandInput } from './dto/card-fees.dto.js';

const providerHasBrands = 'Remova as bandeiras deste provedor antes de removê-lo.';

@Injectable()
export class CardFeesService {
  constructor(
    @Inject(CardFeesRepository) private readonly repository: CardFeesRepository,
    @Inject(OrganizationAccessService) private readonly organizations: OrganizationAccessService,
  ) {}

  async findAll(session: AuthSession) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const rows = await this.repository.findAll(organizationId);
    return taxBrandsSchema.parse(
      rows.map((row) => ({
        id: row.id,
        provider: { id: row.providerId, name: row.providerName, logo: row.providerLogo },
        name: row.name,
        channel: row.channel,
        logo: row.logo,
        rates: toRates(row.rates),
      })),
    );
  }

  async catalog(session: AuthSession) {
    const organizationId = await this.organizations.requireActiveOrganization(session);
    const [providers, brands] = await Promise.all([
      this.repository.listProviders(organizationId),
      this.repository.listBrands(organizationId),
    ]);
    return catalogResponseSchema.parse({
      providers: providers.map(toProviderResponse),
      brands: brands.map(toBrandResponse),
    });
  }

  async saveProvider(data: ProviderInput, session: AuthSession, id?: string) {
    const organizationId = await this.organizations.requireManager(session);
    const result = await this.write(() => this.repository.saveProvider(organizationId, data, id));
    if (!result) throw new NotFoundException('Provedor não encontrado nesta empresa.');
    return toProviderResponse(result);
  }

  async saveBrand(data: BrandInput, session: AuthSession, id?: string) {
    const organizationId = await this.organizations.requireManager(session);
    if (!(await this.repository.findProvider(organizationId, data.providerId)))
      throw new NotFoundException('Provedor não encontrado nesta empresa.');
    const values = { ...data, rates: toRates(data.rates) };
    const result = await this.write(() => this.repository.saveBrand(organizationId, values, id));
    if (!result) throw new NotFoundException('Bandeira não encontrada nesta empresa.');
    return toBrandResponse(result);
  }

  async reorderBrands(providerId: string, brandIds: string[], session: AuthSession) {
    const organizationId = await this.organizations.requireManager(session);
    const result = await this.repository.reorderBrands(organizationId, providerId, brandIds);

    if (result === 'not-found')
      throw new NotFoundException('Provedor não encontrado nesta empresa.');
    if (result === 'stale')
      throw new ConflictException(
        'A lista de bandeiras mudou. Atualize a página e tente novamente.',
      );
  }

  async removeProvider(id: string, session: AuthSession) {
    const organizationId = await this.organizations.requireManager(session);

    if (await this.repository.hasProviderBrands(organizationId, id)) {
      throw new ConflictException(providerHasBrands);
    }

    try {
      const result = await this.repository.removeProvider(organizationId, id);
      if (!result) throw new NotFoundException('Provedor não encontrado nesta empresa.');
    } catch (error) {
      if (databaseErrorCode(error) === '23503') throw new ConflictException(providerHasBrands);
      throw error;
    }
  }

  async removeBrand(id: string, session: AuthSession) {
    const organizationId = await this.organizations.requireManager(session);
    const result = await this.repository.removeBrand(organizationId, id);

    if (!result) throw new NotFoundException('Bandeira não encontrada nesta empresa.');
  }

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const code = databaseErrorCode(error);
      if (code === '23505') throw new ConflictException('Nome de provedor já cadastrado.');
      if (code === '23503') throw new NotFoundException('Provedor não encontrado nesta empresa.');
      throw error;
    }
  }
}

function databaseErrorCode(error: unknown) {
  const cause = error instanceof Error && error.cause ? error.cause : error;
  return typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : undefined;
}
