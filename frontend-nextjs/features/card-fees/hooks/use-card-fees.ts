"use client"

import { useQuery } from "@tanstack/react-query"
import { listCardFees } from "../services/list-card-fees"

export const cardFeeKeys = {
  all: ["card-fees"] as const,
  list: () => [...cardFeeKeys.all, "list"] as const,
}

export function useCardFees() {
  return useQuery({
    queryKey: cardFeeKeys.list(),
    queryFn: ({ signal }) => listCardFees(signal),
  })
}
