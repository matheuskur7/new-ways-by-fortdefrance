import { z } from 'zod';

export const organizationDetailsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email().max(254).nullable(),
  address: z.string().trim().max(500).nullable(),
});
export type OrganizationDetailsDto = z.infer<typeof organizationDetailsSchema>;
