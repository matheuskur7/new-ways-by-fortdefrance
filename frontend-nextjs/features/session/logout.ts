import { z } from "zod"

const signOutResponseSchema = z.object({ success: z.literal(true) })
let signingOut = false
let sessionRevision = 0
let pendingSignOut: Promise<void> | null = null

export function isSigningOut() {
  return signingOut
}

export function getSessionRevision() {
  return sessionRevision
}

// Chamado quando a navegação chega ao login, após concluir a saída.
export function completeSignOut() {
  if (!signingOut || pendingSignOut) return
  signingOut = false
  sessionRevision++
}

/** Encerra a sessão atual pelo Better Auth. Chamadas simultâneas compartilham o envio. */
export function signOut(): Promise<void> {
  if (signingOut) return pendingSignOut ?? Promise.resolve()
  signingOut = true
  sessionRevision++

  pendingSignOut = Promise.resolve()
    .then(async () => {
      const response = await fetch("/backend/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        credentials: "include",
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      })
      if (!response.ok) throw new Error("Não foi possível sair da conta.")
      signOutResponseSchema.parse(await response.json())
    })
    .catch((error: unknown) => {
      signingOut = false
      sessionRevision++
      throw error
    })
    .finally(() => {
      pendingSignOut = null
    })

  return pendingSignOut
}
