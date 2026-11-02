import { api } from "@/lib/api"

export async function requestPasswordReset(email: string) {
  // A resposta é a mesma para e-mails cadastrados ou não.
  await api.post("/api/auth/request-password-reset", { email })
}
