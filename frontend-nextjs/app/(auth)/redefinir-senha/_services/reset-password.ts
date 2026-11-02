import { z } from "zod"
import { api } from "@/lib/api"

const resetPasswordResponseSchema = z.object({ status: z.literal(true) })

export async function resetPassword(token: string, newPassword: string) {
  const response = await api.post<unknown>("/api/auth/reset-password", {
    token,
    newPassword,
  })
  resetPasswordResponseSchema.parse(response.data)
}
