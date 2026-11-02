import { api } from "@/lib/api"

export async function acceptInvitation(invitationId: string) {
  await api.post("/api/auth/organization/accept-invitation", { invitationId })
}

export async function rejectInvitation(invitationId: string) {
  await api.post("/api/auth/organization/reject-invitation", { invitationId })
}
