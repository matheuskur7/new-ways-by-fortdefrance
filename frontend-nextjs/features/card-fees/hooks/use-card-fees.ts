"use client"

import { useQuery } from "@tanstack/react-query"
import { listCardFees } from "../services/list-card-fees"
import { cardFeeKeys } from "./query-keys"

export function useCardFees(userId: string, organizationId: string) {
  return useQuery({
    queryKey: cardFeeKeys.list(userId, organizationId),
    queryFn: ({ signal }) => listCardFees(signal),
  })
}
