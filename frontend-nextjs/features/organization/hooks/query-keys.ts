export const organizationKeys = {
  all: ["organizations"] as const,
  list: (userId: string) => [...organizationKeys.all, "list", userId] as const,
  detail: (userId: string, organizationId: string) =>
    [...organizationKeys.all, "detail", userId, organizationId] as const,
  members: (userId: string, organizationId: string) =>
    [...organizationKeys.all, "members", userId, organizationId] as const,
  membersPage: (userId: string, organizationId: string, pageIndex: number) =>
    [...organizationKeys.members(userId, organizationId), pageIndex] as const,
}

/** Usada por outras telas para bloquear ações enquanto a empresa é trocada. */
export const enterOrganizationMutationKey = ["enter-organization"] as const
