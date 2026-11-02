import { z } from "zod"

const installmentsSchema = z
  .number()
  .int()
  .min(1, "Informe ao menos uma parcela.")
  .max(32767, "O limite é 32.767 parcelas.")
export const providerFormSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do provedor.").max(200),
})
export const rateFormSchema = z.object({
  installments: installmentsSchema,
  ratePercent: z
    .string()
    .trim()
    .regex(
      /^(?:0|[1-9]\d?)(?:[.,]\d{1,2})?$/,
      "Informe de 0 a 99,99%, com até duas casas decimais."
    ),
})
export const groupFormSchema = z.object({
  providerId: z.string().min(1, "Selecione um provedor."),
  name: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(200),
  channel: z.string().trim().min(2, "Informe o canal de pagamento.").max(200),
  displayOrder: z
    .number()
    .int("Informe um número inteiro.")
    .min(-2147483648)
    .max(2147483647),
  logoSvg: z
    .string()
    .trim()
    .max(50000)
    .refine(
      (value) => !value || /^<svg[\s>][\s\S]*<\/svg>$/i.test(value),
      "Informe um SVG completo ou deixe em branco."
    ),
  rates: z
    .array(rateFormSchema)
    .min(1, "Cadastre ao menos uma taxa.")
    .max(32767)
    .refine(
      (rates) =>
        new Set(rates.map((rate) => rate.installments)).size === rates.length,
      "Não repita a quantidade de parcelas."
    ),
})
const idSchema = z.uuidv7()
export const managedProviderSchema = providerFormSchema.extend({ id: idSchema })
export const managedRateSchema = z.object({
  id: idSchema,
  installments: installmentsSchema,
  ratePercent: z.string().regex(/^(?:0|[1-9]\d?)\.\d{2}$/),
})
export const managedGroupSchema = z.object({
  id: idSchema,
  providerId: idSchema,
  name: z.string().min(2),
  channel: z.string().min(2),
  displayOrder: z.number().int(),
  logoSvg: z.string().nullable(),
  rates: z.array(managedRateSchema),
})
export const feeCatalogSchema = z.object({
  providers: z.array(managedProviderSchema),
  groups: z.array(managedGroupSchema),
})
export type ProviderForm = z.infer<typeof providerFormSchema>
export type GroupForm = z.infer<typeof groupFormSchema>
export type RateForm = z.infer<typeof rateFormSchema>
export type ManagedProvider = z.infer<typeof managedProviderSchema>
export type ManagedGroup = z.infer<typeof managedGroupSchema>
export type ManagedRate = z.infer<typeof managedRateSchema>
export type FeeEditor =
  | { kind: "provider"; provider?: ManagedProvider }
  | { kind: "group"; group?: ManagedGroup }
