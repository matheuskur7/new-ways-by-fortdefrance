import { api } from "@/lib/api"
import {
  invitationSchema,
  inviteMemberSchema,
  type InviteMemberData,
} from "../schemas"

/** Cria o convite e envia o e-mail; convidar de novo substitui o convite pendente. */
export async function inviteMember(
  organizationId: string,
  data: InviteMemberData
) {
  const parsed = inviteMemberSchema.parse(data)
  const response = await api.post<unknown>(
    "/api/auth/organization/invite-member",
    { organizationId, ...parsed }
  )
  const invitation = invitationSchema.parse(response.data)
  if (
    invitation.organizationId !== organizationId ||
    invitation.email !== parsed.email
  )
    throw new Error("O convite retornado não corresponde ao solicitado.")
  return invitation
}
