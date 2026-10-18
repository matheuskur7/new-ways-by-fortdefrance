import "server-only"

import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { serverGet } from "@/lib/api-server"
import { hasSessionToken, readSession } from "@/lib/session"

// Deduplica apenas dentro da renderização, sem compartilhar sessões entre usuários.
export const getSession = cache(async () => {
  const cookie = (await headers()).get("cookie")
  if (!cookie) return null

  const response = await serverGet(
    "/api/auth/get-session?disableCookieCache=true&disableRefresh=true"
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
