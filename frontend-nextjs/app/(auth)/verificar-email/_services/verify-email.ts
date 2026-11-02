import { z } from "zod"
import { api } from "@/lib/api"

const verifyEmailResponseSchema = z.object({ status: z.literal(true) })

/**
 * Confirma o e-mail pelo proxy do backend. Na primeira confirmação, o Better
 * Auth inicia a sessão e grava o cookie na origem do frontend.
 */
export async function verifyEmail(token: string, signal?: AbortSignal) {
  const response = await api.get<unknown>("/api/auth/verify-email", {
    params: { token },
    signal,
  })
  return verifyEmailResponseSchema.parse(response.data)
}
