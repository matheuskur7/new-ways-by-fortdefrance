import type { ReactNode } from "react"
import { requireSession } from "@/lib/auth-server"
import { getActiveOrganization } from "@/features/organization/services/require-active-organization"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { NavigationHeader } from "@/components/layout/navigation-header"
import { PageTransition } from "@/components/page-transition"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode
}) {
  const [{ user }, organization] = await Promise.all([
    requireSession(),
    getActiveOrganization(),
  ])
  return (
    <SidebarProvider>
      <a
        href="#page-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-3 focus:ring-2 focus:ring-primary"
      >
        Ir para o conteúdo
      </a>
      <AppSidebar user={user} />
      <SidebarInset className="min-w-0 bg-muted/40">
        <NavigationHeader
          organizationName={
            organization === undefined
              ? "Empresa indisponível"
              : (organization?.name ?? "Selecione uma empresa")
          }
        />
        <main
          id="page-content"
          tabIndex={-1}
          className="flex flex-1 flex-col p-1.5 outline-none sm:p-2 lg:p-2.5"
        >
          <PageTransition>{children}</PageTransition>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
