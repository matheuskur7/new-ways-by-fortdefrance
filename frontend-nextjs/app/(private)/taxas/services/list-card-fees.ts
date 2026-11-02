import { api } from "@/lib/api"
import { feeBrandListSchema, type CardFeeProvider } from "../schemas"

export async function listCardFees(signal?: AbortSignal) {
  const response = await api.get<unknown>("/card-fees", { signal })
  const brands = feeBrandListSchema.parse(response.data)
  const providers = new Map<string, CardFeeProvider>()
  for (const brand of brands) {
    let provider = providers.get(brand.provider.id)
    if (!provider) {
      provider = { ...brand.provider, brands: [] }
      providers.set(provider.id, provider)
    }
    provider.brands.push(brand)
  }
  return [...providers.values()]
}
