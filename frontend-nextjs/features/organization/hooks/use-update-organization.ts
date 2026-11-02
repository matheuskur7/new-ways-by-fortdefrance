"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toastManager } from "@/components/ui/toast"
import { getHttpStatus } from "@/lib/api"
import { mutationErrorToast } from "@/lib/mutation-error"
import { updateOrganization } from "../services/update-organization"
import { organizationKeys } from "./query-keys"
import type { CompanyDetailsData, Organization } from "../schemas"

const showError = mutationErrorToast({
  title: "Não foi possível salvar",
  messages: { 403: "Você não tem permissão para alterar esta empresa." },
  fallback: "Confira os dados e sua conexão. Suas edições foram mantidas.",
})

export function useUpdateOrganization(userId: string, organizationId: string) {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useMutation({
    mutationKey: ["update-organization", organizationId],
    mutationFn: (data: CompanyDetailsData) =>
      updateOrganization(organizationId, data),
    onSuccess: (organization) => {
      // A resposta já traz os dados salvos; evita buscar a lista novamente.
      queryClient.setQueryData<Organization[]>(
        organizationKeys.list(userId),
        (organizations) =>
          organizations?.map((item) =>
            item.id === organization.id
              ? { ...item, name: organization.name, slug: organization.slug }
              : item
          )
      )
      router.refresh()
      toastManager.add({
        title: "Empresa atualizada",
        description: "Suas alterações foram salvas.",
        type: "success",
      })
    },
    onError: (error) => {
      if (getHttpStatus(error) === 403) router.refresh()
      showError(error)
    },
  })
}
