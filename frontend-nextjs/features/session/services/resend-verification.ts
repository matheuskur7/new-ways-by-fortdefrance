import { z } from "zod"
import { api } from "@/lib/api"

const resendResponseSchema = z.object({ status: z.literal(true) })

/** Intervalo entre reenvios, igual ao limite aplicado pelo backend. */
export const RESEND_COOLDOWN_SECONDS = 60

/**
 * Pede um novo link de confirmação. A resposta é a mesma para qualquer e-mail,
 * cadastrado ou não, e o backend ignora pedidos repetidos dentro do intervalo.
 */
export async function resendVerification(email: string, callbackURL: string) {
  const response = await api.post<unknown>(
    "/api/auth/send-verification-email",
    { email, callbackURL }
  )
  resendResponseSchema.parse(response.data)
}
