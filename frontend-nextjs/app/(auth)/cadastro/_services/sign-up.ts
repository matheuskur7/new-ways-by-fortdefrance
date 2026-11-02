import { api } from "@/lib/api"
import type { SignUpFormData } from "../schemas"

export async function signUp(
  { name, email, password }: SignUpFormData,
  callbackURL: string
) {
  // Com verificação obrigatória, o cadastro não inicia sessão: envia o link de confirmação.
  await api.post("/api/auth/sign-up/email", {
    name,
    email,
    password,
    callbackURL,
  })
}
