import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { BrandInput, ProviderInput } from './dto/card-fees.dto.js';
import { DatabaseService } from '../../shared/database/database.service.js';
import { taxProviders, taxBrands } from '../../shared/database/schemas/taxes.schema.js';

@Injectable()
export class CardFeesRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  findAll(organizationId: string) {
    return this.database.db
      .select({
        id: taxBrands.id,
        providerId: taxProviders.id,
        providerName: taxProviders.name,
        providerLogo: taxProviders.logo,
        name: taxBrands.name,
        channel: taxBrands.channel,
        logo: taxBrands.logo,
        rates: taxBrands.rates,
      })
      .from(taxBrands)
      .innerJoin(taxProviders, eq(taxBrands.providerId, taxProviders.id))
      .where(eq(taxBrands.organizationId, organizationId))
      .orderBy(
        asc(taxProviders.name),
        asc(taxProviders.id),
        asc(taxBrands.displayOrder),
        asc(taxBrands.name),
        asc(taxBrands.id),
      );
  }

  listProviders(organizationId: string) {
    return this.database.db
      .select({ id: taxProviders.id, name: taxProviders.name, logo: taxProviders.logo })
      .from(taxProviders)
      .where(eq(taxProviders.organizationId, organizationId))
      .orderBy(asc(taxProviders.name), asc(taxProviders.id));
  }

  async findProvider(organizationId: string, id: string) {
    const [provider] = await this.database.db
      .select()
      .from(taxProviders)
      .where(and(eq(taxProviders.organizationId, organizationId), eq(taxProviders.id, id)))
      .limit(1);

    return provider;
  }

  async saveProvider(organizationId: string, data: ProviderInput, id?: string) {
    const [provider] = id
      ? await this.database.db
          .update(taxProviders)
          .set(data)
          .where(and(eq(taxProviders.organizationId, organizationId), eq(taxProviders.id, id)))
          .returning()
      : await this.database.db
          .insert(taxProviders)
          .values({ ...data, organizationId })
          .returning();

    return provider;
  }

  listBrands(organizationId: string) {
    return this.database.db
      .select()
      .from(taxBrands)
      .where(eq(taxBrands.organizationId, organizationId))
      .orderBy(asc(taxBrands.displayOrder), asc(taxBrands.name), asc(taxBrands.id));
  }

  async saveBrand(organizationId: string, data: BrandInput, id?: string) {
    const [brand] = id
      ? await this.database.db
          .update(taxBrands)
          .set(data)
          .where(and(eq(taxBrands.organizationId, organizationId), eq(taxBrands.id, id)))
          .returning()
      : await this.database.db
          .insert(taxBrands)
          .values({ ...data, organizationId })
          .returning();

    return brand;
  }

  reorderBrands(organizationId: string, providerId: string, brandIds: string[]) {
    return this.database.db.transaction(async (tx) => {
      const [provider] = await tx
        .select({ id: taxProviders.id })
        .from(taxProviders)
        .where(
          and(eq(taxProviders.organizationId, organizationId), eq(taxProviders.id, providerId)),
        )
        .for('update');
      if (!provider) return 'not-found' as const;

      const brands = await tx
        .select({ id: taxBrands.id })
        .from(taxBrands)
        .where(
          and(eq(taxBrands.organizationId, organizationId), eq(taxBrands.providerId, providerId)),
        )
        .for('update');
      const ids = new Set(brandIds);
      if (brands.length !== brandIds.length || brands.some((brand) => !ids.has(brand.id)))
        return 'stale' as const;

      for (const [displayOrder, id] of brandIds.entries()) {
        await tx
          .update(taxBrands)
          .set({ displayOrder })
          .where(
            and(
              eq(taxBrands.organizationId, organizationId),
              eq(taxBrands.providerId, providerId),
              eq(taxBrands.id, id),
            ),
          );
      }

      return 'ok' as const;
    });
  }

  async hasProviderBrands(organizationId: string, providerId: string) {
    const [brand] = await this.database.db
      .select({ id: taxBrands.id })
      .from(taxBrands)
      .where(
        and(eq(taxBrands.organizationId, organizationId), eq(taxBrands.providerId, providerId)),
      )
      .limit(1);

    return Boolean(brand);
  }

  async removeProvider(organizationId: string, id: string) {
    const [provider] = await this.database.db
      .delete(taxProviders)
      .where(and(eq(taxProviders.organizationId, organizationId), eq(taxProviders.id, id)))
      .returning({ id: taxProviders.id });

    return provider;
  }

  async removeBrand(organizationId: string, id: string) {
    const [brand] = await this.database.db
      .delete(taxBrands)
      .where(and(eq(taxBrands.organizationId, organizationId), eq(taxBrands.id, id)))
      .returning({ id: taxBrands.id });

    return brand;
  }
}
