"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toastManager } from "@/components/ui/toast"
import { mutationErrorToast } from "@/lib/mutation-error"
import { enterOrganizationMutationKey } from "@/features/organization/hooks/query-keys"
import { selectOrganization } from "../_services/select-organization"

export function useEnterOrganization() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: enterOrganizationMutationKey,
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
    onError: mutationErrorToast({
      id: "organization-selection-error",
      title: "Não foi possível entrar na empresa",
      messages: { 403: "Você não possui mais acesso a essa empresa." },
      fallback: "Tente novamente em instantes.",
    }),
  })
}
