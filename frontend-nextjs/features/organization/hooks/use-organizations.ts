"use client"

import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { listOrganizations } from "../services/list-organizations"

export function useOrganizations(userId: string, enabled = true) {
  return useQuery({
    queryKey: ["organizations", userId],
    queryFn: ({ signal }) => listOrganizations(signal),
    enabled,
    staleTime: 0,
    retry: (failureCount, error) => {
      if (
        isAxiosError(error) &&
        [401, 403].includes(error.response?.status ?? 0)
      ) {
        return false
      }
      return failureCount < 1
    },
  })
}
