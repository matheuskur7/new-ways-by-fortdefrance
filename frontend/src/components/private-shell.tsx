"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightLeft, Building2, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { AuthContext } from "@/lib/auth-schemas";
import { AppSidebar } from "@/components/app-sidebar";
import { IconButton } from "@/components/ui/icon-button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";

function NavigationHeader({ organization, onSwitchOrganization }: { organization: AuthContext["organization"]; onSwitchOrganization: () => void }) {
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();
  const expanded = isMobile ? openMobile : open;
  const Icon = isMobile ? Menu : open ? PanelLeftClose : PanelLeftOpen;
  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-2 sm:px-2.5">
      <IconButton label={expanded ? "Recolher menu de navegação" : "Abrir menu de navegação"} tooltipSide="right" variant="ghost" aria-expanded={expanded} onClick={toggleSidebar}>
        <Icon aria-hidden="true" />
      </IconButton>
      <div className="ml-auto min-w-0 text-right">
        <p className="text-xs text-muted-foreground">Você está em</p>
        <p className="truncate text-sm font-medium">{organization?.name ?? "Selecione uma empresa"}</p>
      </div>
      <IconButton label="Ir para outra empresa" variant="ghost" size="icon-lg" className="size-10" onClick={onSwitchOrganization}>
        <Building2 className="size-6" aria-hidden="true" />
      </IconButton>
    </header>
  );
}

export function PrivateShell({ children, context }: { children: ReactNode; context: AuthContext }) {
  const router = useRouter();
  const [confirmSwitch, setConfirmSwitch] = useState(false);
  return (
    <SidebarProvider>
      <a href="#page-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-3 focus:ring-2 focus:ring-primary">
        Ir para o conteúdo
      </a>
      <AppSidebar user={context.user} onSwitchOrganization={() => setConfirmSwitch(true)} />
      <SidebarInset className="min-w-0 bg-muted/40">
        <NavigationHeader organization={context.organization} onSwitchOrganization={() => setConfirmSwitch(true)} />
        <main id="page-content" tabIndex={-1} className="flex-1 p-1.5 outline-none sm:p-2 lg:p-2.5">{children}</main>
      </SidebarInset>
      <AlertDialog open={confirmSwitch} onOpenChange={setConfirmSwitch}>
        <AlertDialogContent>
          <AlertDialogHeader variant="info" icon={ArrowRightLeft}>
            <AlertDialogTitle>Ir para outra empresa?</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza de que deseja ir para outra empresa? Você será direcionado para a seleção de empresas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg">Cancelar</AlertDialogCancel>
            <AlertDialogAction size="lg" onClick={() => { setConfirmSwitch(false); router.push("/organizations"); }}>Ir para outra empresa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
