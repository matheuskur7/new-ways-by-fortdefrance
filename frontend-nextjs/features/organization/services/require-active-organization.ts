import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"
import { requireSession } from "@/lib/auth-server"
import { serverGet } from "@/lib/api-server"
import { organizationListSchema } from "../schemas"

// Layout e página compartilham a mesma verificação dentro do request.
export const requireActiveOrganization = cache(async () => {
  const { session } = await requireSession()
  if (!session.activeOrganizationId) redirect("/empresas")
  const response = await serverGet("/organizations")
  if (response.status === 401) redirect("/entrar?reason=session-expired")
  if (!response.ok)
    throw new Error("Não foi possível verificar a empresa ativa.")
  const organization = organizationListSchema
    .parse(await response.json())
    .find((item) => item.id === session.activeOrganizationId)
  if (!organization) redirect("/empresas")
  return organization
})
