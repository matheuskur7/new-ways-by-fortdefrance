export const cardFeeKeys = {
  all: ["card-fees"] as const,
  scope: (userId: string, organizationId: string) =>
    [...cardFeeKeys.all, userId, organizationId] as const,
  list: (userId: string, organizationId: string) =>
    [...cardFeeKeys.scope(userId, organizationId), "list"] as const,
  settings: (userId: string, organizationId: string) =>
    [...cardFeeKeys.scope(userId, organizationId), "settings"] as const,
}
