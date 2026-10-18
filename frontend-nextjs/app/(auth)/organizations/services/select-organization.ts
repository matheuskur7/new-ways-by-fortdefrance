import { api } from "@/lib/api"
import {
  selectedOrganizationSchema,
  selectOrganizationSchema,
} from "../schemas"

export async function selectOrganization(organizationId: string) {
  const body = selectOrganizationSchema.parse({ organizationId })
  const response = await api.post<unknown>(
    "/api/auth/organization/set-active",
    body
  )
  const organization = selectedOrganizationSchema.parse(response.data)
  if (organization.id !== organizationId) {
    throw new Error("A empresa selecionada não corresponde à solicitação.")
  }
  return organization
}
