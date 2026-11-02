import {
  providerResponseSchema,
  groupResponseSchema,
  rateResponseSchema,
} from './dto/card-fees.dto.js';
import type { ProviderResponse, GroupResponse, RateResponse } from './dto/card-fees.dto.js';

export function toProviderResponse({ id, name }: ProviderResponse): ProviderResponse {
  return providerResponseSchema.parse({ id, name });
}

export function toRateResponse({ id, installments, ratePercent }: RateResponse): RateResponse {
  return rateResponseSchema.parse({ id, installments, ratePercent });
}

export function toGroupResponse(group: GroupResponse): GroupResponse {
  return groupResponseSchema.parse({
    id: group.id,
    providerId: group.providerId,
    name: group.name,
    channel: group.channel,
    displayOrder: group.displayOrder,
    logoSvg: group.logoSvg,
    rates: group.rates.map(toRateResponse),
  });
}
