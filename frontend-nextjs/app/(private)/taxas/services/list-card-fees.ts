import { api } from "@/lib/api"
import { feeGroupListSchema, type CardFeeProvider } from "../schemas"

export async function listCardFees(signal?: AbortSignal) {
  const response = await api.get<unknown>("/card-fees", { signal })
  const groups = feeGroupListSchema.parse(response.data)
  const providers = new Map<string, CardFeeProvider>()
  for (const group of groups) {
    let provider = providers.get(group.provider.id)
    if (!provider) {
      provider = { ...group.provider, groups: [] }
      providers.set(provider.id, provider)
    }
    provider.groups.push(group)
  }
  return [...providers.values()]
}
