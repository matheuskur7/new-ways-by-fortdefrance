import { z } from "zod";

export const organizationIdSchema = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9_-]+$/);
export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});
export const invitationSchema = z.object({
  id: z.string(),
  email: z.email(),
  role: z.string().nullable(),
  status: z.string(),
  expiresAt: z.coerce.date(),
});
export const organizationSettingsSchema = z.object({
  organization: companySchema,
  members: z.array(
    z.object({
      id: z.string(),
      role: z.string(),
      user: z.object({ id: z.string(), name: z.string(), email: z.email() }),
    }),
  ),
  invitations: z.array(invitationSchema),
});
export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Informe um e-mail válido.")),
  role: z.enum(["member", "admin"], {
    error: "Selecione uma permissão válida.",
  }),
});
export const invitationDetailsSchema = invitationSchema.extend({
  organizationName: z.string(),
});
export type OrganizationSettingsData = z.infer<
  typeof organizationSettingsSchema
>;
export function canManageOrganization(role: string) {
  return role
    .split(",")
    .some((value) => ["owner", "admin"].includes(value.trim()));
}
export function organizationRoleLabel(role: string | null) {
  if (role?.split(",").includes("owner")) return "Proprietário";
  if (role?.split(",").includes("admin")) return "Administrador";
  return "Membro";
}
