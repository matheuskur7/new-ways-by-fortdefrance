import { providerResponseSchema, brandResponseSchema } from './dto/card-fees.dto.js';
import type { ProviderResponse, BrandResponse, TaxRate } from './dto/card-fees.dto.js';

export function toRates(rates: readonly TaxRate[]): TaxRate[] {
  return rates
    .map(({ installments, ratePercent }) => ({ installments, ratePercent }))
    .sort((a, b) => a.installments - b.installments);
}

/** Registro do banco: as datas chegam como `Date` e saem em ISO 8601. */
type Stored<T> = Omit<T, 'createdAt' | 'updatedAt'> & { createdAt: Date; updatedAt: Date };

export function toProviderResponse({
  id,
  name,
  logo,
  createdAt,
  updatedAt,
}: Stored<ProviderResponse>): ProviderResponse {
  return providerResponseSchema.parse({
    id,
    name,
    logo,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  });
}

export function toBrandResponse(brand: Stored<BrandResponse>): BrandResponse {
  return brandResponseSchema.parse({
    id: brand.id,
    providerId: brand.providerId,
    name: brand.name,
    channel: brand.channel,
    displayOrder: brand.displayOrder,
    logo: brand.logo,
    rates: toRates(brand.rates),
    createdAt: brand.createdAt.toISOString(),
    updatedAt: brand.updatedAt.toISOString(),
  });
}
