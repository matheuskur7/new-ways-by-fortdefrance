import { api } from "@/lib/api"
import { organizationListSchema } from "../schemas"

export async function listOrganizations(signal?: AbortSignal) {
  const response = await api.get<unknown>("/organizations", {
    signal,
  })
  return organizationListSchema.parse(response.data)
}
