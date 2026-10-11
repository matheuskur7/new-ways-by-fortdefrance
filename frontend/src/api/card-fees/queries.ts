"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeeGroups } from "./api";

export function useFeeGroups() {
  return useQuery({
    queryKey: ["card-fees", "groups"],
    queryFn: ({ signal }) => getFeeGroups(signal),
    staleTime: 60_000,
    retry: false,
  });
}
