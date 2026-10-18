"use client"

import { useQuery } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { listOrganizationMembers } from "../services/list-organization-members"

export const organizationMembersKey = (
  userId: string,
  organizationId: string
) => ["organization-members", userId, organizationId] as const

export function useOrganizationMembers(
  userId: string,
  organizationId: string,
  pageIndex: number
) {
  return useQuery({
    queryKey: [...organizationMembersKey(userId, organizationId), pageIndex],
    queryFn: ({ signal }) =>
      listOrganizationMembers(organizationId, pageIndex, signal),
    staleTime: 0,
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
