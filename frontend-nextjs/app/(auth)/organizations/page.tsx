import { requireSession } from "@/lib/auth-server"
import { OrganizationsList } from "./components/organizations-list"
import { UserBanner } from "./components/user-banner"

export default async function OrganizationsPage() {
  const { user, session } = await requireSession()
  return (
    <div className="flex flex-1 flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Escolha sua empresa
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Selecione seu espaço de trabalho para continuar.
        </p>
      </header>
      <OrganizationsList
        userId={user.id}
        activeOrganizationId={session.activeOrganizationId}
      />
      <UserBanner user={user} />
    </div>
  )
}
