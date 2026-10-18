import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getBackendUrl } from "@/lib/backend-url"
import { hasSessionToken, readSession } from "@/lib/session"

// Deduplica apenas dentro da renderização, sem compartilhar sessões entre usuários.
export const getSession = cache(async () => {
  const cookie = (await headers()).get("cookie")
  if (!cookie) return null

  const response = await fetch(
    `${getBackendUrl()}/api/auth/get-session?disableCookieCache=true&disableRefresh=true`,
    {
      headers: { cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    }
  )
  return readSession(response)
})

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    const cookie = (await headers()).get("cookie") ?? ""
    redirect(
      hasSessionToken(cookie) ? "/login?reason=session-expired" : "/login"
    )
  }
  return session
}
