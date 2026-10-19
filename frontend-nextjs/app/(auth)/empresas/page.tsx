import { Building2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { requireSession } from "@/lib/auth-server"
import { OrganizationsList } from "./components/organizations-list"
import { UserBanner } from "./components/user-banner"

export default async function OrganizationsPage() {
  const { user, session } = await requireSession()
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3">
        <PageHeader
          icon={Building2}
          title="Escolha sua empresa"
          subtitle="Selecione seu espaço de trabalho para continuar."
        />
        <OrganizationsList
          userId={user.id}
          activeOrganizationId={session.activeOrganizationId}
        />
      </div>
      <UserBanner user={user} />
    </div>
  )
}
