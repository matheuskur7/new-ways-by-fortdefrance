import "server-only"

import { redirect } from "next/navigation"
import { requireSession } from "@/lib/auth-server"
import { serverGet } from "@/lib/api-server"
import { organizationListSchema } from "@/app/(auth)/organizations/schemas"

export async function requireActiveOrganization() {
  const { session } = await requireSession()
  if (!session.activeOrganizationId) redirect("/organizations")
  const response = await serverGet("/organizations")
  if (response.status === 401) redirect("/login?reason=session-expired")
  if (!response.ok)
    throw new Error("Não foi possível verificar a empresa ativa.")
  const organization = organizationListSchema
    .parse(await response.json())
    .find((item) => item.id === session.activeOrganizationId)
  if (!organization) redirect("/organizations")
  return organization
}
