import { z } from "zod"

export const userSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe seu nome completo.")
    .max(200, "Use até 200 caracteres."),
})
export type UserSettingsData = z.infer<typeof userSettingsSchema>

export const imageUploadSchema = z.object({
  id: z.uuid(),
  url: z.url(),
  method: z.literal("PUT"),
  headers: z.object({ "If-None-Match": z.literal("*").optional() }),
})
export const completedImageSchema = z.object({
  id: z.uuid(),
  status: z.literal("ready"),
})
export const userUpdateResponseSchema = z.object({ status: z.literal(true) })
