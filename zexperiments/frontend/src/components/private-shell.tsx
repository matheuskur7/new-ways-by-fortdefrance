"use client";

import type { ReactNode } from "react";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { AuthContext } from "@/lib/auth-schemas";
import { AppSidebar } from "@/components/app-sidebar";
import { SessionMonitor } from "@/components/auth/session-monitor";
import { IconButton } from "@/components/ui/icon-button";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

function NavigationHeader({
  organization,
}: {
  organization: AuthContext["organization"];
}) {
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();
  const expanded = isMobile ? openMobile : open;
  const Icon = isMobile ? Menu : open ? PanelLeftClose : PanelLeftOpen;
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
      <div className="ml-auto min-w-0 text-right">
        <p className="text-xs text-muted-foreground">Você está em</p>
        <p className="truncate text-sm font-medium">
          {organization?.name ?? "Selecione uma empresa"}
        </p>
      </div>
    </header>
  );
}

export function PrivateShell({
  children,
  context,
}: {
  children: ReactNode;
  context: AuthContext;
}) {
  return (
    <SidebarProvider>
      <SessionMonitor />
      <a
        href="#page-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-3 focus:ring-2 focus:ring-primary"
      >
        Ir para o conteúdo
      </a>
      <AppSidebar user={context.user} />
      <SidebarInset className="min-w-0 bg-muted/40">
        <NavigationHeader organization={context.organization} />
        <main
          id="page-content"
          tabIndex={-1}
          className="flex-1 p-1.5 outline-none sm:p-2 lg:p-2.5"
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
