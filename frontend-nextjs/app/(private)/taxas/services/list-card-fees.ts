import { api } from "@/lib/api"
import { feeGroupListSchema } from "../schemas"

export async function listCardFees(signal?: AbortSignal) {
  const response = await api.get<unknown>("/card-fees", { signal })
  return feeGroupListSchema.parse(response.data)
}
