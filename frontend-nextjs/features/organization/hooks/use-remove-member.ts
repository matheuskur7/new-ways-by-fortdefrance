"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toastManager } from "@/components/ui/toast"
import { getHttpStatus } from "@/lib/api"
import { mutationErrorToast } from "@/lib/mutation-error"
import { removeMember } from "../services/remove-member"
import { organizationKeys } from "./query-keys"
import type { RemoveMemberData } from "../schemas"

const forbidden = "Você não tem permissão para remover este membro."
const showError = mutationErrorToast({
  title: "Não foi possível remover o membro",
  messages: { 401: forbidden, 403: forbidden },
  fallback: "Confira sua conexão e tente novamente. O membro foi mantido.",
})

export function useRemoveMember(userId: string, organizationId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationKey: ["remove-member", organizationId],
    mutationFn: (data: RemoveMemberData) => removeMember(organizationId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.members(userId, organizationId),
      })
      toastManager.add({
        title: "Membro removido",
        description: "O membro não tem mais acesso à empresa.",
        type: "success",
      })
    },
    onError: (error) => {
      const status = getHttpStatus(error)
      if (status === 401 || status === 403) router.refresh()
      showError(error)
    },
  })
}
