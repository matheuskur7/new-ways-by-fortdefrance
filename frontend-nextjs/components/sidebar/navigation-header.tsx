"use client"
import { HeaderTabs } from "@/components/sidebar/header-tabs"
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { useSidebar } from "@/components/ui/sidebar"
import { useOrganizations } from "@/app/(auth)/organizations/hooks/use-organizations"
import { Skeleton } from "@/components/ui/skeleton"
export function NavigationHeader({
  userId,
  activeOrganizationId,
}: {
  userId: string
  activeOrganizationId?: string | null
}) {
  const organizations = useOrganizations(userId)
  const organization = organizations.data?.find(
    (item) => item.id === activeOrganizationId
  )
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar()
  const expanded = isMobile ? openMobile : open
  const Icon = isMobile ? Menu : open ? PanelLeftClose : PanelLeftOpen
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-2 sm:px-2.5">
      <IconButton
        label={
          expanded ? "Recolher menu de navegação" : "Abrir menu de navegação"
        }
        tooltipSide="right"
        variant="ghost"
        aria-expanded={expanded}
        onClick={toggleSidebar}
      >
        <Icon aria-hidden="true" />
      </IconButton>
      <HeaderTabs />
      <div className="ml-auto min-w-0 text-right">
        <p className="text-xs text-muted-foreground">Você está em</p>
        {organizations.isPending ? (
          <Skeleton className="ml-auto h-5 w-36" />
        ) : (
          <p className="truncate text-sm font-medium">
            {organization?.name ??
              (organizations.isError
                ? "Empresa indisponível"
                : "Selecione uma empresa")}
          </p>
        )}
      </div>
    </header>
  )
}
