"use client"

import { ArrowRight, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AnimatedHeight } from "@/components/ui/animated-height"
import { useIsMutating } from "@tanstack/react-query"
import { isSigningOut } from "@/lib/logout"
import { useOrganizations } from "../hooks/use-organizations"
import { useEnterOrganization } from "../hooks/use-enter-organization"

const roleBadges = [
  {
    role: "owner",
    label: "Proprietário",
    color: "border-primary/15 bg-primary/5 text-primary/80",
  },
  {
    role: "admin",
    label: "Administrador",
    color:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  {
    role: "member",
    label: "Membro",
    color: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
]

export function OrganizationsList({
  userId,
  activeOrganizationId,
}: {
  userId: string
  activeOrganizationId?: string | null
}) {
  const pendingLogouts = useIsMutating({ mutationKey: ["logout"] })
  const enterOrganization = useEnterOrganization()
  const organizations = useOrganizations(
    userId,
    pendingLogouts === 0 &&
      !isSigningOut() &&
      !enterOrganization.isPending &&
      !enterOrganization.isSuccess
  )
  return (
    <Card className="animate-in gap-4 ring-0 duration-500 fade-in-0 motion-reduce:animate-none">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Suas empresas</h2>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <p
            role={organizations.isPending ? "status" : undefined}
            aria-hidden={!organizations.isPending}
            className={`pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 text-muted-foreground transition-opacity duration-150 ease-out motion-reduce:transition-none ${organizations.isPending ? "opacity-100" : "opacity-0"}`}
          >
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Carregando empresas…
          </p>
          <AnimatedHeight>
            {organizations.isPending && (
              <p
                aria-hidden="true"
                className="invisible flex items-center gap-2"
              >
                <LoaderCircle
                  className="size-4 animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
                Carregando empresas…
              </p>
            )}
            {organizations.isError && (
              <div className="grid justify-items-start gap-3">
                <p role="alert" className="text-destructive">
                  Não foi possível carregar suas empresas.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  disabled={organizations.isFetching}
                  onClick={() => void organizations.refetch()}
                >
                  {organizations.isFetching ? "Tentando…" : "Tentar novamente"}
                </Button>
              </div>
            )}
            {organizations.isSuccess && organizations.data.length === 0 && (
              <p className="text-muted-foreground">
                Você ainda não participa de nenhuma empresa. Solicite um convite
                ao responsável.
              </p>
            )}
            {organizations.isSuccess && organizations.data.length > 0 && (
              <ul className="grid auto-rows-fr gap-3">
                {organizations.data.map((organization, index) => (
                  <li
                    key={organization.id}
                    className="flex animate-in items-center gap-3 rounded-lg border bg-background px-4 py-3 duration-300 fade-in-0 fill-mode-[both] slide-in-from-top-2 motion-reduce:animate-none"
                    style={{
                      animationDelay: `${60 + Math.min(index, 4) * 50}ms`,
                    }}
                  >
                    <span className="grid min-w-0 flex-1 gap-1 pl-3">
                      <span className="flex flex-wrap gap-1">
                        {roleBadges
                          .filter(({ role }) =>
                            organization.role
                              .split(",")
                              .some((value) => value.trim() === role)
                          )
                          .map(({ role, label, color }) => (
                            <span
                              key={role}
                              className={`inline-flex h-4 w-fit items-center rounded border px-1.5 text-[10px] leading-none font-medium ${color}`}
                            >
                              {label}
                            </span>
                          ))}
                      </span>
                      <span className="relative text-lg leading-tight font-semibold">
                        {organization.id === activeOrganizationId && (
                          <Tooltip>
                            <TooltipTrigger
                              render={<span />}
                              tabIndex={0}
                              aria-label="Empresa ativa"
                              className="absolute top-[0.625em] -left-3 size-2 -translate-y-1/2 rounded-full bg-red-500"
                            />
                            <TooltipContent side="left">
                              Empresa ativa
                            </TooltipContent>
                          </Tooltip>
                        )}
                        <span className="wrap-break-word">
                          {organization.name}
                        </span>
                      </span>
                      <span className="text-[11px] leading-tight wrap-anywhere text-muted-foreground/70">
                        {organization.slug}
                      </span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger
                          render={<span className="inline-flex" />}
                        >
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Entrar em ${organization.name}`}
                            disabled={
                              pendingLogouts > 0 ||
                              isSigningOut() ||
                              enterOrganization.isPending ||
                              enterOrganization.isSuccess
                            }
                            aria-busy={
                              enterOrganization.isPending &&
                              enterOrganization.variables === organization.id
                            }
                            onClick={() =>
                              enterOrganization.mutate(organization.id)
                            }
                          >
                            {enterOrganization.isPending &&
                            enterOrganization.variables === organization.id ? (
                              <LoaderCircle
                                className="animate-spin motion-reduce:animate-none"
                                aria-hidden="true"
                              />
                            ) : (
                              <ArrowRight aria-hidden="true" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Entrar</TooltipContent>
                      </Tooltip>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AnimatedHeight>
        </div>
      </CardContent>
    </Card>
  )
}
