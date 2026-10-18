import { api } from "@/lib/api"
import {
  companyDetailsSchema,
  managedOrganizationSchema,
  type CompanyDetailsData,
} from "../schemas"

export async function updateOrganization(
  organizationId: string,
  data: CompanyDetailsData
) {
  const parsed = companyDetailsSchema.parse(data)
  const response = await api.post<unknown>("/api/auth/organization/update", {
    organizationId,
    data: {
      name: parsed.name,
      email: parsed.email || null,
      address: parsed.address || null,
    },
  })
  const organization = managedOrganizationSchema.parse(response.data)
  if (organization.id !== organizationId)
    throw new Error("A empresa retornada não corresponde à solicitação.")
  return organization
}
