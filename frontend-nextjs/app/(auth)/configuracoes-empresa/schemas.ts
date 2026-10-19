import { z } from "zod"

export const managedOrganizationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  address: z
    .string()
    .nullish()
    .transform((value) => value ?? null),
  email: z
    .email()
    .nullish()
    .transform((value) => value ?? null),
})
export type ManagedOrganization = z.infer<typeof managedOrganizationSchema>

export const companyDetailsSchema = z.object({
  address: z.string().trim().max(500, "Use até 500 caracteres."),
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da empresa.")
    .max(200, "Use até 200 caracteres."),
  email: z
    .string()
    .trim()
    .pipe(
      z.union([z.literal(""), z.email("Informe um e-mail válido.").max(254)])
    ),
})
export type CompanyDetailsData = z.infer<typeof companyDetailsSchema>

export const memberRoleSchema = z.enum(["admin", "member"])
export type MemberRole = z.infer<typeof memberRoleSchema>
export const organizationMemberSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  role: z.string().min(1),
  user: z.object({
    id: z.string().min(1),
    name: z.string(),
    email: z.email(),
    image: z.string().nullish(),
  }),
})
export type OrganizationMember = z.infer<typeof organizationMemberSchema>
export const organizationMembersSchema = z.object({
  members: z.array(organizationMemberSchema),
  total: z.number().int().nonnegative(),
})
export const updateMemberRoleSchema = z.object({
  memberId: z.string().min(1),
  role: memberRoleSchema,
})
export type UpdateMemberRoleData = z.infer<typeof updateMemberRoleSchema>
export const updatedMemberSchema = organizationMemberSchema.omit({ user: true })
