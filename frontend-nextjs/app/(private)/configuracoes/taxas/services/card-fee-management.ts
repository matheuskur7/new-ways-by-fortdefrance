import { api } from "@/lib/api"
import {
  feeCatalogSchema,
  providerFormSchema,
  groupFormSchema,
  rateFormSchema,
  managedProviderSchema,
  managedGroupSchema,
  managedRateSchema,
  type ProviderForm,
  type GroupForm,
  type RateForm,
} from "../management-schemas"

export async function listFeeCatalog(signal?: AbortSignal) {
  return feeCatalogSchema.parse(
    (await api.get<unknown>("/card-fees/catalog", { signal })).data
  )
}

export async function saveFeeProvider(data: ProviderForm, id?: string) {
  const body = providerFormSchema.parse(data)
  const response = id
    ? await api.patch<unknown>(`/card-fees/providers/${id}`, body)
    : await api.post<unknown>("/card-fees/providers", body)
  const result = managedProviderSchema.parse(response.data)
  if (id && result.id !== id)
    throw new Error("Provedor incompatível com a solicitação.")

  return result
}

export async function saveFeeGroup(data: GroupForm, id?: string) {
  const values = groupFormSchema.parse(data)
  const body = {
    ...values,
    logoSvg: values.logoSvg || null,
    rates: values.rates.map((rate) => ({
      ...rate,
      ratePercent: Number(rate.ratePercent.replace(",", ".")).toFixed(2),
    })),
  }
  const response = id
    ? await api.patch<unknown>(`/card-fees/groups/${id}`, body)
    : await api.post<unknown>("/card-fees/groups", body)
  const result = managedGroupSchema.parse(response.data)
  if ((id && result.id !== id) || result.providerId !== body.providerId)
    throw new Error("Grupo incompatível com a solicitação.")

  return result
}

export async function saveFeeRate(
  groupId: string,
  data: RateForm,
  id?: string
) {
  const values = rateFormSchema.parse(data)
  const body = {
    ...values,
    ratePercent: Number(values.ratePercent.replace(",", ".")).toFixed(2),
  }
  const response = id
    ? await api.patch<unknown>(`/card-fees/groups/${groupId}/rates/${id}`, body)
    : await api.post<unknown>(`/card-fees/groups/${groupId}/rates`, body)
  const result = managedRateSchema.parse(response.data)
  if (id && result.id !== id)
    throw new Error("Taxa incompatível com a solicitação.")

  return result
}

export async function removeFeeResource(
  kind: "provider" | "group",
  id: string
) {
  const resourceId = managedProviderSchema.shape.id.parse(id)
  const response = await api.delete(
    `/card-fees/${kind === "provider" ? "providers" : "groups"}/${resourceId}`
  )
  if (response.status !== 204)
    throw new Error("A remoção não foi confirmada pelo servidor.")

  return { id: resourceId }
}

export async function reorderFeeGroups(providerId: string, groupIds: string[]) {
  const id = managedProviderSchema.shape.id.parse(providerId)
  const ids = groupIds.map((groupId) =>
    managedGroupSchema.shape.id.parse(groupId)
  )
  if (!ids.length || new Set(ids).size !== ids.length)
    throw new Error("Ordenação inválida.")
  const response = await api.patch(`/card-fees/providers/${id}/groups/order`, {
    groupIds: ids,
  })
  if (response.status !== 204)
    throw new Error("A ordenação não foi confirmada pelo servidor.")
}
