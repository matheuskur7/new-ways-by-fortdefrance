import { z } from "zod"

import { parseBrazilianAmount } from "@/lib/masks"

export const ratePercentSchema = z
  .string()
  .regex(/^(?:0|[1-9][0-9]?)\.[0-9]{2}$/)
export const saleAmountSchema = z.number().positive().max(1_000_000_000)

export const feeRateSchema = z.object({
  installments: z.number().int().min(1).max(32767),
  ratePercent: ratePercentSchema,
})
const logoSchema = z.string().nullable()

export const feeProviderSchema = z.object({
  id: z.uuidv7(),
  name: z.string().min(1),
  logo: logoSchema,
})
export type FeeProvider = z.infer<typeof feeProviderSchema>

export const feeBrandSchema = z.object({
  id: z.uuidv7(),
  provider: feeProviderSchema,
  name: z.string().min(2),
  channel: z.string().min(2),
  logo: logoSchema,
  rates: z.array(feeRateSchema).min(1).max(32767),
})
export type FeeBrand = z.infer<typeof feeBrandSchema>
export type CardFeeProvider = FeeProvider & { brands: FeeBrand[] }

export const feeBrandListSchema = z.array(feeBrandSchema)

export const saleAmountFormSchema = z.object({
  amount: z
    .string()
    .refine(
      (value) =>
        saleAmountSchema.safeParse(parseBrazilianAmount(value)).success,
      "Informe um valor maior que zero e até R$ 1 bilhão."
    ),
})
