"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toastManager } from "@/components/ui/toast"
import { getErrorCode, getHttpStatus } from "@/lib/api"
import { inviteMember } from "../services/invite-member"
import type { InviteMemberData } from "../schemas"

const errorMessages: Record<string, string> = {
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION:
    "Esta pessoa já faz parte da empresa.",
  INVITATION_LIMIT_REACHED: "A empresa atingiu o limite de convites pendentes.",
  INVITATION_EMAIL_FAILED:
    "O e-mail do convite não foi enviado. Confira o endereço e tente novamente.",
}

export function inviteErrorMessage(error: unknown) {
  const code = getErrorCode(error)
  if (code && errorMessages[code]) return errorMessages[code]
  if (getHttpStatus(error) === 403)
    return "Você não tem permissão para convidar membros nesta empresa."
  if (getHttpStatus(error) === 429)
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente."
  return "Confira sua conexão e tente novamente."
}

export function useInviteMember(organizationId: string) {
  const router = useRouter()
  return useMutation({
    mutationKey: ["invite-member", organizationId],
    mutationFn: (data: InviteMemberData) => inviteMember(organizationId, data),
    onSuccess: (invitation) => {
      toastManager.add({
        title: "Convite enviado",
        description: `Enviamos o convite para ${invitation.email}.`,
        type: "success",
      })
    },
    onError: (error) => {
      if (getHttpStatus(error) === 403) router.refresh()
      toastManager.add({
        title: "Não foi possível enviar o convite",
        description: inviteErrorMessage(error),
        type: "error",
      })
    },
  })
}
