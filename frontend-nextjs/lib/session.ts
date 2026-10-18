import { z } from "zod"

const sessionSchema = z.object({
  session: z.object({
    id: z.string(),
    expiresAt: z.coerce.date(),
    activeOrganizationId: z.string().nullish(),
  }),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
    image: z.string().nullish(),
  }),
})

export type AuthSession = z.infer<typeof sessionSchema>

export function hasSessionToken(cookie: string) {
  return cookie
    .split(";")
    .some((entry) =>
      /^(?:__Secure-)?better-auth\.session_token=.+$/.test(entry.trim())
    )
}

export async function readSession(
  response: Response
): Promise<AuthSession | null> {
  if (response.status === 401) return null
  if (!response.ok) throw new Error("Não foi possível verificar a sessão.")

  // Uma resposta inválida não comprova que a sessão expirou.
  return sessionSchema.nullable().parse(await response.json())
}

export function getSessionRedirect(
  pathname: string,
  session: AuthSession | null
) {
  if (pathname === "/login")
    return session ? "/organizations?reason=already-authenticated" : null
  return session ? null : "/login?reason=session-expired"
}
