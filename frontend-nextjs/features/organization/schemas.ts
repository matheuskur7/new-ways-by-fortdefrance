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
export const removeMemberSchema = z.object({ memberId: z.string().min(1) })
export type RemoveMemberData = z.infer<typeof removeMemberSchema>
export const removedMemberSchema = z.object({ member: updatedMemberSchema })

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  member: "Membro",
}

/** Traduz um ou mais cargos do Better Auth ("admin,member") para exibição. */
export function formatRoles(role: string) {
  return role
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => roleLabels[value] ?? value)
    .join(", ")
}

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Informe um e-mail válido.").max(254)),
  role: memberRoleSchema,
})
export type InviteMemberData = z.infer<typeof inviteMemberSchema>

export const invitationSchema = z.object({
  id: z.string().min(1),
  organizationId: z.string().min(1),
  email: z.email(),
  role: z.string().min(1),
  status: z.string().min(1),
  expiresAt: z.coerce.date(),
})

/** Convite visto pelo destinatário, com os dados da empresa e de quem convidou. */
export const invitationDetailsSchema = invitationSchema.extend({
  organizationName: z.string().min(1),
  inviterEmail: z.email(),
})
export type InvitationDetails = z.infer<typeof invitationDetailsSchema>
