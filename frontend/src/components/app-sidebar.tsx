"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronsUpDown, House, UserRound, X } from "lucide-react";
import type { AuthContext } from "@/lib/auth-schemas";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { IconButton } from "@/components/ui/icon-button";
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
];

export function AppSidebar({ user }: { user: AuthContext["user"] }) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const names = user.name.trim().split(/\s+/);
  const displayName = names.length > 1 ? `${names[0]} ${names.at(-1)}` : user.name;

  return (
    <Sidebar collapsible="icon" className="shadow-[3px_0_10px_-4px_rgba(73,73,73,0.16)]">
      <SidebarHeader className="shrink-0 flex-row items-center gap-2 p-3 transition-[padding] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:p-2">
        <Link href="/" aria-label="New Ways — Início" onClick={() => setOpenMobile(false)} className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
          <Image src="/brand/logo.png" alt="" width={48} height={48} className="size-12 shrink-0 object-contain transition-[width,height] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:size-8" />
          <div className="min-w-0 max-w-48 shrink-0 overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
            <p className="text-2xl leading-tight font-bold tracking-tight transition-[font-size] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:text-[0px]"><span className="text-primary italic">New</span> Ways</p>
            <p className="text-xs leading-normal text-muted-foreground transition-[font-size] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:text-[0px]">by Fort de France</p>
          </div>
        </Link>
        <IconButton label="Fechar menu de navegação" variant="ghost" className="md:hidden" onClick={() => setOpenMobile(false)}>
          <X aria-hidden="true" />
        </IconButton>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="px-3 py-3 group-data-[collapsible=icon]:px-2">
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
                    className="border border-transparent data-active:shadow-[inset_2px_0_0_var(--primary)]"
                    onClick={() => setOpenMobile(false)}
                  >
                    <Icon aria-hidden="true" />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" tooltip="Opções do perfil" aria-label="Abrir opções do perfil" className="cursor-pointer" />}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background group-data-[collapsible=icon]:size-8">
                  <UserRound aria-hidden="true" />
                </span>
                <span className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </span>
                <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent side={isMobile ? "top" : "right"} align="end" sideOffset={8} className="min-w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="grid gap-1">
                    <span className="truncate text-foreground">{user.name}</span>
                    <span className="truncate font-normal">{user.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link href="/organizations" />} className="cursor-pointer" onClick={() => setOpenMobile(false)}>
                    <Building2 aria-hidden="true" />
                    Trocar empresa
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutButton variant="menu" />
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
