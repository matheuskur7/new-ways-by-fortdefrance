"use client"

import { LoaderCircle, LogOut, UserRoundX } from "lucide-react"
import { StatusPanel } from "@/components/status-panel"
import { Button } from "@/components/ui/button"
import { useLogoutAction } from "@/features/session/hooks/use-logout"

/** O convite foi enviado para outro e-mail: sai e volta ao convite após entrar. */
export function WrongAccount({
  email,
  loginHref,
}: {
  email: string
  loginHref: string
}) {
  const { logout, disabled } = useLogoutAction(loginHref)
  return (
    <StatusPanel
      icon={UserRoundX}
      tone="warning"
      role="alert"
      title="Convite para outro e-mail"
      description={
        <>
          Você está conectado como{" "}
          <strong className="text-foreground">{email}</strong>. Saia e entre com
          o e-mail que recebeu o convite.
        </>
      }
    >
      <Button
        type="button"
        disabled={disabled}
        aria-busy={logout.isPending}
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
        {logout.isPending ? "Saindo…" : "Sair e trocar de conta"}
      </Button>
    </StatusPanel>
  )
}
