"use client"

import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { getOrganization } from "../services/get-organization"

export const organizationKey = (userId: string, organizationId: string) =>
  ["organization", userId, organizationId] as const

/**
 * Dados editáveis da empresa. Sem cache entre aberturas do modal, para o
 * formulário sempre partir dos dados atuais.
 */
export function useOrganization(userId: string, organizationId: string) {
  return useQuery({
    queryKey: organizationKey(userId, organizationId),
    queryFn: ({ signal }) => getOrganization(organizationId, signal),
    staleTime: 0,
    gcTime: 0,
    retry: (failureCount, error) => {
      if (
        isAxiosError(error) &&
        [400, 401, 403, 404].includes(error.response?.status ?? 0)
      )
        return false
      return failureCount < 1
    },
  })
}
