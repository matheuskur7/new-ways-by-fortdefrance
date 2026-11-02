"use client"

import { useQuery } from "@tanstack/react-query"
import { listOrganizations } from "../services/list-organizations"
import { organizationKeys } from "./query-keys"

export function useOrganizations(userId: string, enabled = true) {
  return useQuery({
    queryKey: organizationKeys.list(userId),
    queryFn: ({ signal }) => listOrganizations(signal),
    enabled,
  })
}
