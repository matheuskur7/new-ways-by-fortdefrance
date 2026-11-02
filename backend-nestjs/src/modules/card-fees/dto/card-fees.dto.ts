import { z } from 'zod';

const logoSchema = z
  .string()
  .trim()
  .max(50000)
  .regex(/^<svg[\s>][\s\S]*<\/svg>$/i)
  .nullable();

export const taxRateSchema = z.strictObject({
  installments: z.number().int().min(1).max(32767),
  ratePercent: z.string().regex(/^(?:0|[1-9]\d?)\.\d{2}$/),
});

export const providerInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
  logo: logoSchema,
});

export const brandInputSchema = z.strictObject({
  providerId: z.uuidv7(),
  name: z.string().trim().min(2).max(200),
  channel: z.string().trim().min(2).max(200),
  displayOrder: z.number().int().min(-32768).max(32767),
  logo: logoSchema,
  rates: z
    .array(taxRateSchema)
    .min(1)
    .max(32767)
    .refine(
      (rates) => new Set(rates.map((rate) => rate.installments)).size === rates.length,
      'Não repita a quantidade de parcelas.',
    ),
});

const providerSchema = providerInputSchema.extend({ id: z.uuidv7() });
const brandSchema = brandInputSchema.extend({ id: z.uuidv7() });
// Datas de auditoria (ISO 8601) exibidas nos modais de gerenciamento.
const auditSchema = z.object({ createdAt: z.iso.datetime(), updatedAt: z.iso.datetime() });

export const providerResponseSchema = providerSchema.extend(auditSchema.shape);
export const brandResponseSchema = brandSchema.extend(auditSchema.shape);
export const catalogResponseSchema = z.object({
  providers: z.array(providerResponseSchema),
  brands: z.array(brandResponseSchema),
});

export const taxBrandsSchema = z.array(
  brandSchema.omit({ providerId: true, displayOrder: true }).extend({
    provider: providerSchema,
  }),
);

export const cardFeeIdParamsSchema = z.strictObject({ id: z.uuidv7() });

export const reorderBrandsSchema = z.strictObject({
  brandIds: z
    .array(z.uuidv7())
    .min(1)
    .max(32768)
    .refine((ids) => new Set(ids).size === ids.length, 'Não repita bandeiras na ordenação.'),
});

export type TaxRate = z.infer<typeof taxRateSchema>;
export type ProviderInput = z.infer<typeof providerInputSchema>;
export type BrandInput = z.infer<typeof brandInputSchema>;
export type ProviderResponse = z.infer<typeof providerResponseSchema>;
export type BrandResponse = z.infer<typeof brandResponseSchema>;
export type TaxBrandView = z.infer<typeof taxBrandsSchema>[number];
export type CardFeeIdParams = z.infer<typeof cardFeeIdParamsSchema>;
export type ReorderBrandsInput = z.infer<typeof reorderBrandsSchema>;
