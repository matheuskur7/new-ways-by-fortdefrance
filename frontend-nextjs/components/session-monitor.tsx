"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toastManager } from "@/components/ui/toast"
import { getSessionRedirect, readSession } from "@/lib/session"
import { SESSION_CHECK_EVENT } from "@/lib/session-events"
import { completeSignOut, getSessionRevision, isSigningOut } from "@/lib/logout"

export function SessionMonitor() {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (pathname === "/login") completeSignOut()
    const controller = new AbortController()
    let checking = false
    let redirecting = false

    async function check() {
      if (
        checking ||
        redirecting ||
        isSigningOut() ||
        document.visibilityState === "hidden"
      )
        return
      checking = true
      const revision = getSessionRevision()
      const stale = () =>
        controller.signal.aborted ||
        isSigningOut() ||
        revision !== getSessionRevision()
      try {
        const response = await fetch(
          "/backend/api/auth/get-session?disableCookieCache=true",
          {
            credentials: "include",
            cache: "no-store",
            signal: AbortSignal.any([
              controller.signal,
              AbortSignal.timeout(10_000),
            ]),
          }
        )
        const session = await readSession(response)
        if (stale()) return
        toastManager.close("session-connection-error")
        const destination = getSessionRedirect(pathname, session)
        if (!destination) return

        redirecting = true
        if (!session) {
          await queryClient.cancelQueries()
          if (stale()) return
          queryClient.clear()
        }
        router.replace(destination)
        router.refresh()
      } catch {
        if (stale()) return
        toastManager.add({
          id: "session-connection-error",
          title: "Não foi possível verificar sua sessão",
          description: "Confira sua conexão e tente novamente.",
          type: "warning",
        })
      } finally {
        checking = false
      }
    }

    function requestCheck() {
      void check()
    }

    requestCheck()
    window.addEventListener("focus", requestCheck)
    window.addEventListener("pageshow", requestCheck)
    document.addEventListener("visibilitychange", requestCheck)
    window.addEventListener(SESSION_CHECK_EVENT, requestCheck)
    return () => {
      controller.abort()
      window.removeEventListener("focus", requestCheck)
      window.removeEventListener("pageshow", requestCheck)
      document.removeEventListener("visibilitychange", requestCheck)
      window.removeEventListener(SESSION_CHECK_EVENT, requestCheck)
    }
  }, [pathname, queryClient, router])

  return null
}
