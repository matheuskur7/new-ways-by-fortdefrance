"use client"

import { LoaderCircle, LogOut, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLogout } from "@/hooks/use-logout"
import { useIsMutating } from "@tanstack/react-query"
import type { AuthSession } from "@/lib/session"

export function UserBanner({ user }: { user: AuthSession["user"] }) {
  const logout = useLogout()
  const pendingSelections = useIsMutating({
    mutationKey: ["enter-organization"],
  })
  return (
    <footer className="mt-auto animate-in pt-2 duration-500 fade-in-0 motion-reduce:animate-none">
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-muted/40 p-4">
        <span className="flex size-18 shrink-0 items-center justify-center rounded-md border bg-background">
          <UserRound className="size-8" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs leading-tight font-medium text-red-600">Olá,</p>
          <p className="-mt-0.5 text-lg leading-tight font-semibold tracking-tight wrap-break-word">
            {user.name}
          </p>
          <p className="mt-1 text-sm break-all text-muted-foreground">
            {user.email}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          disabled={
            logout.isPending || logout.isSuccess || pendingSelections > 0
          }
          aria-busy={logout.isPending}
          onClick={() => logout.mutate()}
        >
          {logout.isPending ? "Saindo…" : "Sair"}
          {logout.isPending ? (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <LogOut aria-hidden="true" />
          )}
        </Button>
      </div>
    </footer>
  )
}
