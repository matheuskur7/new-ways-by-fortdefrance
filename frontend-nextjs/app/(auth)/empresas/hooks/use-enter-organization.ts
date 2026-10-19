"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"
import { toastManager } from "@/components/ui/toast"
import { selectOrganization } from "../services/select-organization"

export function useEnterOrganization() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ["enter-organization"],
    mutationFn: selectOrganization,
    onSuccess: async (organization) => {
      // Dados obtidos no contexto da empresa anterior não devem ser reaproveitados.
      await queryClient.cancelQueries()
      queryClient.removeQueries()
      toastManager.add({
        id: "organization-selected",
        title: "Empresa selecionada",
        description: organization.name,
        type: "success",
      })
      router.replace("/")
    },
    onError: (error) => {
      toastManager.add({
        id: "organization-selection-error",
        title: "Não foi possível entrar na empresa",
        description:
          isAxiosError(error) && error.response?.status === 403
            ? "Você não possui mais acesso a essa empresa."
            : "Tente novamente em instantes.",
        type: "error",
      })
    },
  })
}
