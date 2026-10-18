"use client"

import { useQuery } from "@tanstack/react-query"
import { listCardFees } from "../services/list-card-fees"

export function useCardFees() {
  return useQuery({
    queryKey: ["card-fees"],
    queryFn: ({ signal }) => listCardFees(signal),
  })
}
