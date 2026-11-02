"use client"
import { HeaderTabs } from "@/components/layout/header-tabs"
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { useSidebar } from "@/components/ui/sidebar"
export function NavigationHeader({
  organizationName,
}: {
  organizationName: string
}) {
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
        <p className="truncate text-sm font-medium">{organizationName}</p>
      </div>
    </header>
  )
}
