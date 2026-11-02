"use client"

import { useQuery } from "@tanstack/react-query"
import { getOrganization } from "../services/get-organization"
import { organizationKeys } from "./query-keys"

/**
 * Dados editáveis da empresa. Sem cache entre aberturas do modal, para o
 * formulário sempre partir dos dados atuais.
 */
export function useOrganization(userId: string, organizationId: string) {
  return useQuery({
    queryKey: organizationKeys.detail(userId, organizationId),
    queryFn: ({ signal }) => getOrganization(organizationId, signal),
    gcTime: 0,
  })
}
