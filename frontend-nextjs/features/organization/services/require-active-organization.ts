import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { requireSession } from "@/lib/auth-server"
import { serverGet } from "@/lib/api-server"
import { organizationListSchema } from "../schemas"

/**
 * Empresa ativa com o vínculo atual do usuário: `null` quando não houver uma
 * válida e `undefined` quando o backend não confirmar a lista de empresas.
 * Layouts e páginas compartilham a mesma consulta dentro do request.
 */
export const getActiveOrganization = cache(async () => {
  const { session } = await requireSession()
  if (!session.activeOrganizationId) return null
  const response = await serverGet("/organizations")
  if (response.status === 401) redirect("/entrar?reason=session-expired")
  if (!response.ok) return undefined
  const organizations = organizationListSchema.safeParse(
    await response.json().catch(() => null)
  )
  if (!organizations.success) return undefined
  return (
    organizations.data.find(
      (item) => item.id === session.activeOrganizationId
    ) ?? null
  )
})

export const requireActiveOrganization = cache(async () => {
  const organization = await getActiveOrganization()
  if (organization === undefined)
    throw new Error("Não foi possível verificar a empresa ativa.")
  if (!organization) redirect("/empresas")
  return organization
})
