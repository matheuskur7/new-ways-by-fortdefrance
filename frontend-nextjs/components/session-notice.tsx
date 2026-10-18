"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { toastManager } from "@/components/ui/toast"

export function SessionNotice() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const reason = searchParams.get("reason")
    const url = new URL(window.location.href)
    // A limpeza síncrona também evita repetição dos efeitos no Strict Mode.
    if (!reason || url.searchParams.get("reason") !== reason) return

    if (pathname === "/login" && reason === "session-expired") {
      toastManager.add({
        id: "session-expired",
        title: "Sua sessão expirou",
        description: "Entre novamente para continuar.",
        type: "warning",
      })
    } else if (
      pathname === "/organizations" &&
      reason === "already-authenticated"
    ) {
      toastManager.add({
        id: "already-authenticated",
        title: "Você já está conectado",
        description: "Bem-vindo ao sistema.",
        type: "success",
      })
    } else {
      return
    }

    url.searchParams.delete("reason")
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`
    )
  }, [pathname, searchParams])

  return null
}
