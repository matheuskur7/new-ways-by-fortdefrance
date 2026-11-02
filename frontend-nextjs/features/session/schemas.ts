import { z } from "zod"

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z.email("Informe um e-mail válido.").max(254, "Use até 254 caracteres.")
  )

/** Mesmos limites de senha configurados no Better Auth. */
export const passwordSchema = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .max(128, "Use até 128 caracteres.")

/** Nova senha com confirmação, usada no cadastro e na redefinição. */
export const newPasswordFields = {
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Confirme a senha."),
}

export function passwordsMatch(data: {
  password: string
  confirmPassword: string
}) {
  return data.password === data.confirmPassword
}

export const passwordMismatch = {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
}
