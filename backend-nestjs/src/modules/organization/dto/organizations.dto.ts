import { z } from 'zod';

export const organizationResponseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  role: z.string().min(1),
});

export const organizationListResponseSchema = z.array(organizationResponseSchema);
export type OrganizationListDto = z.infer<typeof organizationListResponseSchema>;
