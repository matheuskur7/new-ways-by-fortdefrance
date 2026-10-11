import { z } from "zod";

export const ratePercentSchema = z.string().regex(/^(?:0|[1-9][0-9]?)\.[0-9]{2}$/);

export const feeRateSchema = z.object({
  installments: z.number().int().min(1).max(12),
  ratePercent: ratePercentSchema,
});
export const feeGroupSchema = z.object({
  id: z.string().min(1), name: z.string().min(2), channel: z.string().min(2),
  logoSvg: z.string().nullable(), rates: z.array(feeRateSchema).min(1).max(12),
});
export type FeeGroup = z.infer<typeof feeGroupSchema>;
