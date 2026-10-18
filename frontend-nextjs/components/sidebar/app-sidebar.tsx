"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Calculator,
  ChevronsUpDown,
  House,
  UserRoundCog,
  UserRound,
  X,
} from "lucide-react"
import type { AuthSession } from "@/lib/session"
import { useLogout } from "@/hooks/use-logout"
import { useIsMutating } from "@tanstack/react-query"
import { LogOut, LoaderCircle } from "lucide-react"
import { Brand } from "@/components/brand/brand"
import { BusinessBrand } from "@/components/brand/business-brand"
import { SidebarDailyIndicators } from "@/components/sidebar/sidebar-daily-indicators"
import { IconButton } from "@/components/ui/icon-button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/sidebar"

const navigation = [
  { href: "/", label: "Início", icon: House },
  { href: "/taxas", label: "Calculadora de Taxas", icon: Calculator },
]

export function AppSidebar({ user }: { user: AuthSession["user"] }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <Sidebar
      collapsible="icon"
      className="shadow-[3px_0_10px_-4px_rgba(73,73,73,0.16)]"
    >
      <SidebarHeader className="shrink-0 flex-row items-center gap-2 p-3 transition-[padding] duration-200 ease-in-out group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pt-2 group-data-[collapsible=icon]:pb-3 motion-reduce:transition-none">
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                href="/"
                aria-label="New Ways — Início"
                onClick={() => setOpenMobile(false)}
                className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden"
              />
            }
          >
            <BusinessBrand
              variant="logo"
              className="w-12 shrink-0 transition-[width] duration-200 ease-in-out group-data-[collapsible=icon]:w-8 motion-reduce:transition-none [&_img]:w-full"
            />
            <Brand variant="sidebar" />
          </TooltipTrigger>
          <TooltipContent side="bottom">voltar à home</TooltipContent>
        </Tooltip>
        <IconButton
          label="Fechar menu de navegação"
          variant="ghost"
          className="md:hidden"
          onClick={() => setOpenMobile(false)}
        >
          <X aria-hidden="true" />
        </IconButton>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="py-3 transition-[padding] duration-200 ease-in-out group-data-[collapsible=icon]:pt-4 motion-reduce:transition-none">
        <SidebarDailyIndicators />
        <nav
          aria-label="Navegação principal"
          className="px-3 transition-[padding] duration-200 ease-in-out group-data-[collapsible=icon]:px-2 motion-reduce:transition-none"
        >
          <SidebarMenu className="gap-1">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== "/" && pathname.startsWith(`${href}/`))
              return (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    render={href === "/" ? <Link href={href} /> : undefined}
                    disabled={href !== "/"}
                    isActive={active}
                    aria-current={active ? "page" : undefined}
                    aria-label={label}
                    tooltip={label}
                    className="h-10 border border-transparent text-[15px] transition-[width,height,padding,font-size] duration-200 ease-in-out group-data-[collapsible=icon]:text-sm motion-reduce:transition-none data-active:shadow-[inset_2px_0_0_var(--primary)]"
                    onClick={() => setOpenMobile(false)}
                  >
                    <Icon
                      className="size-4.5! transition-[width,height] duration-200 ease-in-out group-data-[collapsible=icon]:size-4! motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                    <span className="max-w-40 overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,font-size,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:text-[0px] group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none">
                      {label}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </nav>
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter className="p-3 transition-[padding] duration-200 ease-in-out group-data-[collapsible=icon]:p-2 motion-reduce:transition-none">
        <SidebarMenu>
          <SidebarMenuItem>
            <UserDropdown user={user} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function UserDropdown({ user }: { user: AuthSession["user"] }) {
  const { isMobile, state, setOpenMobile } = useSidebar()
  const logout = useLogout()
  const pendingSelections = useIsMutating({
    mutationKey: ["enter-organization"],
  })
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const names = user.name.trim().split(/\s+/)
  const displayName =
    names.length > 1 ? `${names[0]} ${names.at(-1)}` : user.name

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  aria-label="Abrir opções do perfil"
                  className="h-auto! cursor-pointer duration-200 ease-in-out group-data-[collapsible=icon]:h-auto! motion-reduce:transition-none"
                />
              }
            />
          }
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background transition-[width,height] duration-200 ease-in-out group-data-[collapsible=icon]:size-8 motion-reduce:transition-none">
            {user.image && user.image !== failedImage ? (
              <Image
                src={user.image}
                alt=""
                width={40}
                height={40}
                unoptimized
                className="size-full rounded-md object-cover"
                onError={() => setFailedImage(user.image ?? null)}
              />
            ) : (
              <UserRound
                className="size-5! transition-[width,height] duration-200 ease-in-out group-data-[collapsible=icon]:size-4! motion-reduce:transition-none"
                aria-hidden="true"
              />
            )}
          </span>
          <span className="grid max-w-40 min-w-0 flex-1 overflow-hidden text-left whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none">
            <span className="truncate text-sm leading-tight font-medium transition-[font-size] duration-200 ease-in-out group-data-[collapsible=icon]:text-[0px] motion-reduce:transition-none">
              {displayName}
            </span>
            <span className="truncate text-xs leading-normal text-muted-foreground transition-[font-size] duration-200 ease-in-out group-data-[collapsible=icon]:text-[0px] motion-reduce:transition-none">
              {user.email}
            </span>
          </span>
          <ChevronsUpDown
            className="ml-auto transition-[width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:w-0! group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </TooltipTrigger>
        <TooltipContent
          side={!isMobile && state === "collapsed" ? "right" : "top"}
        >
          Opções do perfil
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        side={!isMobile && state === "collapsed" ? "right" : "top"}
        align="end"
        sideOffset={!isMobile && state === "collapsed" ? 12 : 8}
        className={`${!isMobile && state === "collapsed" ? "min-w-60" : "min-w-0"} translate-y-0 opacity-100 transition-[opacity,translate] duration-200 ease-in-out data-ending-style:translate-y-2 data-ending-style:opacity-0 data-starting-style:translate-y-2 data-starting-style:opacity-0 motion-reduce:transition-none`}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background text-foreground">
              {user.image && user.image !== failedImage ? (
                <Image
                  src={user.image}
                  alt=""
                  width={40}
                  height={40}
                  unoptimized
                  className="size-full object-cover"
                  onError={() => setFailedImage(user.image ?? null)}
                />
              ) : (
                <UserRound className="size-5" aria-hidden="true" />
              )}
            </span>
            <span className="grid min-w-0 gap-1">
              <span className="truncate text-foreground">{user.name}</span>
              <span className="truncate font-normal">{user.email}</span>
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href="/user-settings" />}
            className="cursor-pointer"
            onClick={() => setOpenMobile(false)}
          >
            <UserRoundCog aria-hidden="true" />
            Ajustes do Usuário
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href="/organizations" />}
            className="cursor-pointer"
            onClick={() => setOpenMobile(false)}
          >
            <Building2 aria-hidden="true" />
            Minhas empresas
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={
              logout.isPending || logout.isSuccess || pendingSelections > 0
            }
            onClick={() => logout.mutate()}
          >
            {logout.isPending ? (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <LogOut aria-hidden="true" />
            )}
            {logout.isPending ? "Saindo…" : "Sair"}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
