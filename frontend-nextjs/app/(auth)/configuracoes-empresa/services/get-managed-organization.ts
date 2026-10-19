import "server-only"

import { managedOrganizationSchema } from "../schemas"
import { redirect } from "next/navigation"
import { serverGet } from "@/lib/api-server"
import {
  canManageOrganization,
  organizationListSchema,
} from "../../empresas/schemas"

export async function getManagedOrganization(id: string) {
  const response = await serverGet("/organizations")
  if (response.status === 401) redirect("/entrar?reason=session-expired")
  if (!response.ok)
    throw new Error("Não foi possível verificar o acesso à empresa.")
  const organizations = organizationListSchema.parse(await response.json())
  const organization = organizations.find((item) => item.id === id)
  if (!organization || !canManageOrganization(organization.role))
    redirect("/empresas")
  const details = await serverGet(
    `/api/auth/organization/get-organization?organizationId=${encodeURIComponent(id)}`
  )
  if (details.status === 401) redirect("/entrar?reason=session-expired")
  if ([400, 403, 404].includes(details.status)) redirect("/empresas")
  if (!details.ok)
    throw new Error("Não foi possível carregar os dados da empresa.")
  const result = managedOrganizationSchema.parse(await details.json())
  if (result.id !== id)
    throw new Error("A empresa retornada não corresponde à solicitação.")
  return result
}
