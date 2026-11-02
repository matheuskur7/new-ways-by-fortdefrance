import { z } from "zod"

const idSchema = z.uuidv7()
const svgPattern = /^<svg[\s>][\s\S]*<\/svg>$/i
const maxLogoLength = 50000
/** Quantidade máxima de parcelas editáveis em um grupo de taxas (72x). */
export const maxInstallments = 72

export const svgLogoSchema = z
  .string()
  .trim()
  .max(maxLogoLength, "O SVG deve ter até 50.000 caracteres.")
  .refine((value) => svgPattern.test(value), "Envie um arquivo SVG válido.")

const auditSchema = {
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
}
const installmentsSchema = z.number().int().min(1).max(32767)
const ratePercentSchema = z.string().regex(/^(?:0|[1-9]\d?)\.\d{2}$/)

export const feeProviderSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  logo: z.string().nullable(),
  ...auditSchema,
})
export const feeBrandSchema = z.object({
  id: idSchema,
  providerId: idSchema,
  name: z.string().min(2),
  channel: z.string().min(2),
  displayOrder: z.number().int(),
  logo: z.string().nullable(),
  rates: z
    .array(
      z.object({
        installments: installmentsSchema,
        ratePercent: ratePercentSchema,
      })
    )
    .min(1),
  ...auditSchema,
})
export const feeSettingsSchema = z.object({
  providers: z.array(feeProviderSchema),
  brands: z.array(feeBrandSchema),
})
export type FeeProvider = z.infer<typeof feeProviderSchema>
export type FeeBrand = z.infer<typeof feeBrandSchema>
export type FeeSettings = z.infer<typeof feeSettingsSchema>

// Logos vazios no formulário significam "sem logo".
const optionalLogoSchema = z.union([z.literal(""), svgLogoSchema])

export const providerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do provedor.")
    .max(200, "Use até 200 caracteres."),
  logo: optionalLogoSchema,
})
export type ProviderForm = z.input<typeof providerFormSchema>

export const brandFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe ao menos 2 caracteres.")
    .max(200, "Use até 200 caracteres."),
  channel: z
    .string()
    .trim()
    .min(2, "Informe o canal de pagamento.")
    .max(200, "Use até 200 caracteres."),
  logo: optionalLogoSchema,
  rates: z
    .array(
      z.object({
        installments: installmentsSchema.max(maxInstallments),
        ratePercent: z
          .string()
          .trim()
          .regex(
            /^(?:0|[1-9]\d?)(?:[.,]\d{1,2})?$/,
            "Informe de 0 a 99,99%, com até duas casas."
          ),
      })
    )
    .min(1, "Cadastre ao menos uma parcela.")
    .max(
      maxInstallments,
      `O limite é ${maxInstallments} parcelas. Reduza a quantidade para salvar.`
    ),
})
export type BrandForm = z.input<typeof brandFormSchema>

/** Converte "3,9" em "3.90", formato exigido pela API. */
export function toApiPercent(value: string) {
  return Number(value.trim().replace(",", ".")).toFixed(2)
}

/** Exibe "3.90" como "3,90" nos campos do formulário. */
export function toFormPercent(value: string) {
  return value.replace(".", ",")
}
