import { z } from "zod"
import {
  emailSchema,
  newPasswordFields,
  passwordMismatch,
  passwordsMatch,
} from "@/features/session/schemas"

export const signUpFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Informe seu nome.")
      .max(120, "Use até 120 caracteres."),
    email: emailSchema,
    ...newPasswordFields,
  })
  .refine(passwordsMatch, passwordMismatch)

export type SignUpFormData = z.infer<typeof signUpFormSchema>
