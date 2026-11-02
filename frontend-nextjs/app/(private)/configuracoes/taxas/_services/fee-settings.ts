import { api, expectNoContent } from "@/lib/api"
import {
  brandFormSchema,
  feeBrandSchema,
  feeProviderSchema,
  feeSettingsSchema,
  providerFormSchema,
  toApiPercent,
  type BrandForm,
  type ProviderForm,
} from "../schemas"

const idSchema = feeProviderSchema.shape.id

export async function listFeeSettings(signal?: AbortSignal) {
  const response = await api.get<unknown>("/card-fees/catalog", { signal })
  return feeSettingsSchema.parse(response.data)
}

export async function saveProvider(data: ProviderForm, id?: string) {
  const values = providerFormSchema.parse(data)
  const body = { name: values.name, logo: values.logo || null }
  const response = id
    ? await api.patch<unknown>(
        `/card-fees/providers/${idSchema.parse(id)}`,
        body
      )
    : await api.post<unknown>("/card-fees/providers", body)
  const provider = feeProviderSchema.parse(response.data)
  if (id && provider.id !== id)
    throw new Error("Provedor incompatível com a solicitação.")
  return provider
}

export async function saveBrand(
  providerId: string,
  displayOrder: number,
  data: BrandForm,
  id?: string
) {
  const values = brandFormSchema.parse(data)
  const body = {
    providerId: idSchema.parse(providerId),
    name: values.name,
    channel: values.channel,
    displayOrder,
    logo: values.logo || null,
    rates: values.rates.map((rate) => ({
      installments: rate.installments,
      ratePercent: toApiPercent(rate.ratePercent),
    })),
  }
  const response = id
    ? await api.patch<unknown>(`/card-fees/brands/${idSchema.parse(id)}`, body)
    : await api.post<unknown>("/card-fees/brands", body)
  const brand = feeBrandSchema.parse(response.data)
  if ((id && brand.id !== id) || brand.providerId !== providerId)
    throw new Error("Grupo de taxas incompatível com a solicitação.")
  return brand
}

async function remove(path: string) {
  expectNoContent(
    await api.delete(path),
    "A remoção não foi confirmada pelo servidor."
  )
}

export async function removeProvider(id: string) {
  return remove(`/card-fees/providers/${idSchema.parse(id)}`)
}

export async function removeBrand(id: string) {
  return remove(`/card-fees/brands/${idSchema.parse(id)}`)
}

export async function reorderBrands(providerId: string, brandIds: string[]) {
  const ids = brandIds.map((id) => idSchema.parse(id))
  if (!ids.length || new Set(ids).size !== ids.length)
    throw new Error("Ordenação inválida.")
  expectNoContent(
    await api.patch(
      `/card-fees/providers/${idSchema.parse(providerId)}/brands/order`,
      { brandIds: ids }
    ),
    "A ordenação não foi confirmada pelo servidor."
  )
}
