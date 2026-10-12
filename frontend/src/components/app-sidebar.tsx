"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Calculator, ChevronsUpDown, House, UserRound, X } from "lucide-react";
import type { AuthContext } from "@/lib/auth-schemas";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { SidebarDailyIndicators } from "@/components/sidebar-daily-indicators";
import { IconButton } from "@/components/ui/icon-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

const navigation = [
  { href: "/", label: "Início", icon: House },
  { href: "/taxas", label: "Calculadora de Taxas", icon: Calculator },
];

export function AppSidebar({ user, onSwitchOrganization }: { user: AuthContext["user"]; onSwitchOrganization: () => void }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" className="shadow-[3px_0_10px_-4px_rgba(73,73,73,0.16)]">
      <SidebarHeader className="shrink-0 flex-row items-center gap-2 p-3 transition-[padding] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:p-2">
        <Tooltip>
          <TooltipTrigger render={<Link href="/" aria-label="New Ways — Início" onClick={() => setOpenMobile(false)} className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden" />}>
            <Image src="/brand/logo.png" alt="" width={48} height={48} className="size-12 shrink-0 object-contain transition-[width,height] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:size-8" />
            <div className="min-w-0 max-w-48 shrink-0 overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
              <p className="text-2xl leading-tight font-bold tracking-tight transition-[font-size] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:text-[0px]"><span className="text-primary italic">New</span> Ways</p>
              <p className="text-xs leading-normal text-muted-foreground transition-[font-size] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:text-[0px]">by Fort de France</p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">voltar à home</TooltipContent>
        </Tooltip>
        <IconButton label="Fechar menu de navegação" variant="ghost" className="md:hidden" onClick={() => setOpenMobile(false)}>
          <X aria-hidden="true" />
        </IconButton>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="px-3 py-3 group-data-[collapsible=icon]:px-2">
        <SidebarDailyIndicators />
        <nav aria-label="Navegação principal">
          <SidebarMenu className="gap-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={<Link href={href} />}
                    isActive={active}
                    aria-current={active ? "page" : undefined}
                    aria-label={label}
                    tooltip={label}
                    className="h-10 border border-transparent text-[15px] transition-[width,height,padding,font-size] duration-200 ease-linear motion-reduce:transition-none data-active:shadow-[inset_2px_0_0_var(--primary)] group-data-[collapsible=icon]:text-sm"
                    onClick={() => setOpenMobile(false)}
                  >
                    <Icon className="size-4.5! transition-[width,height] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:size-4!" aria-hidden="true" />
                    <span className="max-w-40 overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,font-size,opacity] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:text-[0px] group-data-[collapsible=icon]:opacity-0">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-3 transition-[padding] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserDropdown user={user} onSwitchOrganization={onSwitchOrganization} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function UserDropdown({ user, onSwitchOrganization }: { user: AuthContext["user"]; onSwitchOrganization: () => void }) {
  const { isMobile, state, setOpenMobile } = useSidebar();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const names = user.name.trim().split(/\s+/);
  const displayName = names.length > 1 ? `${names[0]} ${names.at(-1)}` : user.name;

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger render={<DropdownMenuTrigger render={<SidebarMenuButton size="lg" aria-label="Abrir opções do perfil" className="h-auto! cursor-pointer duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:h-auto!" />} />}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background transition-[width,height] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:size-8">
            <UserRound className="size-5! transition-[width,height] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:size-4!" aria-hidden="true" />
          </span>
          <span className="grid min-w-0 max-w-40 flex-1 overflow-hidden text-left whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
            <span className="truncate text-sm leading-tight font-medium transition-[font-size] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:text-[0px]">{displayName}</span>
            <span className="truncate text-xs leading-normal text-muted-foreground transition-[font-size] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:text-[0px]">{user.email}</span>
          </span>
          <ChevronsUpDown className="ml-auto transition-[width,opacity] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:w-0! group-data-[collapsible=icon]:opacity-0" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent side={!isMobile && state === "collapsed" ? "right" : "top"}>Opções do perfil</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side={!isMobile && state === "collapsed" ? "right" : "top"} align="end" sideOffset={!isMobile && state === "collapsed" ? 12 : 8} className={`${!isMobile && state === "collapsed" ? "min-w-60" : "min-w-0"} translate-y-0 opacity-100 transition-[opacity,translate] duration-200 ease-out data-starting-style:translate-y-2 data-starting-style:opacity-0 data-ending-style:translate-y-2 data-ending-style:opacity-0 motion-reduce:transition-none`}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background text-foreground">
              {user.image && user.image !== failedImage ? (
                <Image src={user.image} alt="" width={40} height={40} unoptimized className="size-full object-cover" onError={() => setFailedImage(user.image ?? null)} />
              ) : <UserRound className="size-5" aria-hidden="true" />}
            </span>
            <span className="grid min-w-0 gap-1">
              <span className="truncate text-foreground">{user.name}</span>
              <span className="truncate font-normal">{user.email}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => { setOpenMobile(false); onSwitchOrganization(); }}>
            <Building2 aria-hidden="true" />
            Ir para outra empresa
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <SignOutButton variant="menu" />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
