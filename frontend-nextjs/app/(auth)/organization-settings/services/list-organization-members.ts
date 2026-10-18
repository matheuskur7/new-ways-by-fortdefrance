import { api } from "@/lib/api"
import { organizationMembersSchema } from "../schemas"

export const MEMBERS_PAGE_SIZE = 10

export async function listOrganizationMembers(
  organizationId: string,
  pageIndex: number,
  signal?: AbortSignal
) {
  const response = await api.get<unknown>(
    "/api/auth/organization/list-members",
    {
      params: {
        organizationId,
        limit: MEMBERS_PAGE_SIZE,
        offset: pageIndex * MEMBERS_PAGE_SIZE,
        sortBy: "id",
        sortDirection: "asc",
      },
      signal,
    }
  )
  const result = organizationMembersSchema.parse(response.data)
  if (
    result.members.some(
      (member) =>
        member.organizationId !== organizationId ||
        member.userId !== member.user.id
    )
  )
    throw new Error("A lista de membros não corresponde à empresa solicitada.")
  return result
}
