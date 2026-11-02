import { z } from "zod"
import {
  newPasswordFields,
  passwordMismatch,
  passwordsMatch,
} from "@/features/session/schemas"

export const resetPasswordFormSchema = z
  .object(newPasswordFields)
  .refine(passwordsMatch, passwordMismatch)

export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>
