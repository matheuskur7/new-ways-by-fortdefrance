import { api } from "@/lib/api"
import { managedOrganizationSchema } from "../schemas"

export async function getOrganization(
  organizationId: string,
  signal?: AbortSignal
) {
  const response = await api.get<unknown>(
    "/api/auth/organization/get-organization",
    { params: { organizationId }, signal }
  )
  const organization = managedOrganizationSchema.parse(response.data)
  if (organization.id !== organizationId)
    throw new Error("A empresa retornada não corresponde à solicitação.")
  return organization
}
