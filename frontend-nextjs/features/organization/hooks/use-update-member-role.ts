"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toastManager } from "@/components/ui/toast"
import { getHttpStatus } from "@/lib/api"
import { mutationErrorToast } from "@/lib/mutation-error"
import { updateMemberRole } from "../services/update-member-role"
import { organizationKeys } from "./query-keys"
import type { UpdateMemberRoleData } from "../schemas"

const showError = mutationErrorToast({
  title: "Não foi possível alterar o cargo",
  messages: { 403: "Você não tem permissão para alterar este membro." },
  fallback:
    "Confira sua conexão e tente novamente. O cargo exibido foi mantido.",
})

export function useUpdateMemberRole(userId: string, organizationId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationKey: ["update-member-role", organizationId],
    mutationFn: (data: UpdateMemberRoleData) =>
      updateMemberRole(organizationId, data),
    onSuccess: async (member) => {
      await queryClient.invalidateQueries({
        queryKey: organizationKeys.members(userId, organizationId),
      })
      if (member.userId === userId) {
        await queryClient.invalidateQueries({
          queryKey: organizationKeys.list(userId),
        })
        router.refresh()
      }
      toastManager.add({
        title: "Cargo atualizado",
        description: "A alteração foi salva.",
        type: "success",
      })
    },
    onError: (error) => {
      if (getHttpStatus(error) === 403) router.refresh()
      showError(error)
    },
  })
}
