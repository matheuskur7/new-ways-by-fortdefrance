import { z } from "zod"

export const organizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  role: z.string().min(1),
})

export const organizationListSchema = z.array(organizationSchema)
export type Organization = z.infer<typeof organizationSchema>

export const selectOrganizationSchema = z.object({
  organizationId: z.string().min(1),
})
export const selectedOrganizationSchema = organizationSchema.omit({
  role: true,
})

export function isOrganizationOwner(role: string) {
  return role.split(",").some((value) => value.trim() === "owner")
}

export function canManageOrganization(role: string) {
  return role
    .split(",")
    .some((value) => ["owner", "admin"].includes(value.trim()))
}
