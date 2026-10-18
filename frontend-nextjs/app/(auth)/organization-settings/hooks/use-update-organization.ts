"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"
import { toastManager } from "@/components/ui/toast"
import { updateOrganization } from "../services/update-organization"
import type { CompanyDetailsData } from "../schemas"

export function useUpdateOrganization(userId: string, organizationId: string) {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["update-organization", organizationId],
    mutationFn: (data: CompanyDetailsData) =>
      updateOrganization(organizationId, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["organizations", userId],
      })
      router.refresh()
      toastManager.add({
        title: "Empresa atualizada",
        description: "Suas alterações foram salvas.",
        type: "success",
      })
    },
    onError: (error) => {
      const forbidden = isAxiosError(error) && error.response?.status === 403
      if (forbidden) router.refresh()
      toastManager.add({
        title: "Não foi possível salvar",
        description: forbidden
          ? "Você não tem permissão para alterar esta empresa."
          : "Confira os dados e sua conexão. Suas edições foram mantidas.",
        type: "error",
      })
    },
  })
}
