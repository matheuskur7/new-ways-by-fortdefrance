import { z } from 'zod';
export const cardFeeGroupsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    channel: z.string(),
    logoSvg: z.string().nullable(),
    rates: z.array(
      z.object({
        installments: z.number().int().min(1).max(12),
        ratePercent: z.string().regex(/^\d{1,2}\.\d{2}$/),
      }),
    ),
  }),
);
export type CardFeeGroup = z.infer<typeof cardFeeGroupsSchema>[number];
