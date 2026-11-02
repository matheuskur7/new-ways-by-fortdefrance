import { z } from 'zod';
export const cardFeeGroupsSchema = z.array(
  z.object({
    id: z.uuidv7(),
    provider: z.object({ id: z.uuidv7(), name: z.string() }),
    name: z.string(),
    channel: z.string(),
    logoSvg: z.string().nullable(),
    rates: z.array(
      z.object({
        installments: z.number().int().min(1).max(32767),
        ratePercent: z.string().regex(/^\d{1,2}\.\d{2}$/),
      }),
    ),
  }),
);
export type CardFeeGroup = z.infer<typeof cardFeeGroupsSchema>[number];

export const cardFeeIdParamsSchema = z.strictObject({ id: z.uuidv7() });
export const cardFeeRateParamsSchema = z.strictObject({ groupId: z.uuidv7(), id: z.uuidv7() });
export const cardFeeGroupParamsSchema = z.strictObject({ groupId: z.uuidv7() });
export const providerInputSchema = z.strictObject({ name: z.string().trim().min(1).max(200) });
export const rateInputSchema = z.strictObject({
  installments: z.number().int().min(1).max(32767),
  ratePercent: z.string().regex(/^(?:0|[1-9]\d?)\.\d{2}$/),
});
export const groupInputSchema = z.strictObject({
  providerId: z.uuidv7(),
  name: z.string().trim().min(2).max(200),
  channel: z.string().trim().min(2).max(200),
  displayOrder: z.number().int().min(-2147483648).max(2147483647),
  logoSvg: z
    .string()
    .trim()
    .max(50000)
    .regex(/^<svg[\s>][\s\S]*<\/svg>$/i)
    .nullable(),
  rates: z
    .array(rateInputSchema)
    .min(1)
    .max(32767)
    .refine(
      (rates) => new Set(rates.map((rate) => rate.installments)).size === rates.length,
      'Não repita a quantidade de parcelas.',
    ),
});
export const providerResponseSchema = providerInputSchema.extend({ id: z.uuidv7() });
export const rateResponseSchema = rateInputSchema.extend({ id: z.uuidv7() });
export const groupResponseSchema = groupInputSchema.extend({
  id: z.uuidv7(),
  rates: z.array(rateResponseSchema),
});
export const catalogResponseSchema = z.object({
  providers: z.array(providerResponseSchema),
  groups: z.array(groupResponseSchema),
});
export type ProviderInput = z.infer<typeof providerInputSchema>;
export type GroupInput = z.infer<typeof groupInputSchema>;
export type RateInput = z.infer<typeof rateInputSchema>;

export type CardFeeIdParams = z.infer<typeof cardFeeIdParamsSchema>;
export type CardFeeGroupParams = z.infer<typeof cardFeeGroupParamsSchema>;
export type CardFeeRateParams = z.infer<typeof cardFeeRateParamsSchema>;

export type ProviderResponse = z.infer<typeof providerResponseSchema>;
export type GroupResponse = z.infer<typeof groupResponseSchema>;
export type RateResponse = z.infer<typeof rateResponseSchema>;

export const reorderGroupsSchema = z.strictObject({
  groupIds: z
    .array(z.uuidv7())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, 'Não repita grupos na ordenação.'),
});
export type ReorderGroupsInput = z.infer<typeof reorderGroupsSchema>;
