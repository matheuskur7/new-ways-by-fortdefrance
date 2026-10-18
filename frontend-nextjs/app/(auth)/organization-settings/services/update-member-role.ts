import { api } from "@/lib/api"
import {
  updateMemberRoleSchema,
  updatedMemberSchema,
  type UpdateMemberRoleData,
} from "../schemas"

export async function updateMemberRole(
  organizationId: string,
  data: UpdateMemberRoleData
) {
  const parsed = updateMemberRoleSchema.parse(data)
  const response = await api.post<unknown>(
    "/api/auth/organization/update-member-role",
    {
      organizationId,
      ...parsed,
    }
  )
  const member = updatedMemberSchema.parse(response.data)
  if (
    member.id !== parsed.memberId ||
    member.organizationId !== organizationId ||
    member.role !== parsed.role
  )
    throw new Error(
      "O membro retornado não corresponde à alteração solicitada."
    )
  return member
}
