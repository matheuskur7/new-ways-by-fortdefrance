"use client"

import { useQuery } from "@tanstack/react-query"
import { listOrganizationMembers } from "../services/list-organization-members"
import { organizationKeys } from "./query-keys"

export function useOrganizationMembers(
  userId: string,
  organizationId: string,
  pageIndex: number
) {
  return useQuery({
    queryKey: organizationKeys.membersPage(userId, organizationId, pageIndex),
    queryFn: ({ signal }) =>
      listOrganizationMembers(organizationId, pageIndex, signal),
  })
}
