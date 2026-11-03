import { api } from "@/lib/api"
import {
  removeMemberSchema,
  removedMemberSchema,
  type RemoveMemberData,
} from "../schemas"

export async function removeMember(
  organizationId: string,
  data: RemoveMemberData
) {
  const parsed = removeMemberSchema.parse(data)
  // Envia o ID, nunca o e-mail: a rota nativa também aceita e-mail em memberIdOrEmail.
  const response = await api.post<unknown>(
    "/api/auth/organization/remove-member",
    { organizationId, memberIdOrEmail: parsed.memberId }
  )
  const { member } = removedMemberSchema.parse(response.data)
  if (member.id !== parsed.memberId || member.organizationId !== organizationId)
    throw new Error("O membro removido não corresponde à remoção solicitada.")
  return member
}
