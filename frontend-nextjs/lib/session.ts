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
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
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

/** Telas para quem ainda não entrou; com sessão, a pessoa segue para as empresas. */
const GUEST_ONLY_PATHS = ["/entrar", "/cadastro", "/esqueci-senha"]
/** Telas abertas por links de e-mail, válidas com ou sem sessão. */
const PUBLIC_PATHS = ["/redefinir-senha", "/verificar-email"]

export function isPublicPath(pathname: string) {
  return (
    GUEST_ONLY_PATHS.includes(pathname) ||
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/convite/")
  )
}

export function getSessionRedirect(
  pathname: string,
  session: AuthSession | null
) {
  if (GUEST_ONLY_PATHS.includes(pathname)) return session ? "/empresas" : null
  if (isPublicPath(pathname)) return null
  return session ? null : "/entrar?reason=session-expired"
}
