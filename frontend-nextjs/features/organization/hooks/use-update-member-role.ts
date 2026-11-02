"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"
import { toastManager } from "@/components/ui/toast"
import { updateMemberRole } from "../services/update-member-role"
import { organizationMembersKey } from "./use-organization-members"
import type { UpdateMemberRoleData } from "../schemas"

export function useUpdateMemberRole(userId: string, organizationId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationKey: ["update-member-role", organizationId],
    mutationFn: (data: UpdateMemberRoleData) =>
      updateMemberRole(organizationId, data),
    onSuccess: async (member) => {
      await queryClient.invalidateQueries({
        queryKey: organizationMembersKey(userId, organizationId),
      })
      if (member.userId === userId) {
        await queryClient.invalidateQueries({
          queryKey: ["organizations", userId],
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
      const forbidden = isAxiosError(error) && error.response?.status === 403
      if (forbidden) router.refresh()
      toastManager.add({
        title: "Não foi possível alterar o cargo",
        description: forbidden
          ? "Você não tem permissão para alterar este membro."
          : "Confira sua conexão e tente novamente. O cargo exibido foi mantido.",
        type: "error",
      })
    },
  })
}
