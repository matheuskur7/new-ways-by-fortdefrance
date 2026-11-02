import { providerResponseSchema, brandResponseSchema } from './dto/card-fees.dto.js';
import type { ProviderResponse, BrandResponse, TaxRate } from './dto/card-fees.dto.js';

export function toRates(rates: readonly TaxRate[]): TaxRate[] {
  return rates
    .map(({ installments, ratePercent }) => ({ installments, ratePercent }))
    .sort((a, b) => a.installments - b.installments);
}

export function toProviderResponse({ id, name, logo }: ProviderResponse): ProviderResponse {
  return providerResponseSchema.parse({ id, name, logo });
}

export function toBrandResponse(brand: BrandResponse): BrandResponse {
  return brandResponseSchema.parse({
    id: brand.id,
    providerId: brand.providerId,
    name: brand.name,
    channel: brand.channel,
    displayOrder: brand.displayOrder,
    logo: brand.logo,
    rates: toRates(brand.rates),
  });
}
