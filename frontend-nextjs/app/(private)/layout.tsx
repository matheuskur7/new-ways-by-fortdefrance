import type { ReactNode } from "react"
import { requireSession } from "@/lib/auth-server"
import { AppSidebar } from "@/components/app-sidebar"
import { NavigationHeader } from "@/components/navigation-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function PrivateLayout({
  children,
}: {
  children: ReactNode
}) {
  const { user, session } = await requireSession()
  return (
    <SidebarProvider className="animate-in duration-300 fade-in-0 motion-reduce:animate-none">
      <a
        href="#page-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-3 focus:ring-2 focus:ring-primary"
      >
        Ir para o conteúdo
      </a>
      <AppSidebar user={user} />
      <SidebarInset className="min-w-0 bg-muted/40">
        <NavigationHeader
          userId={user.id}
          activeOrganizationId={session.activeOrganizationId}
        />
        <main
          id="page-content"
          tabIndex={-1}
          className="flex-1 p-1.5 outline-none sm:p-2 lg:p-2.5"
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
