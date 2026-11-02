"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { isAxiosError } from "axios"
import { toastManager } from "@/components/ui/toast"
import { cardFeeKeys } from "../../../taxas/hooks/use-card-fees"
import {
  listFeeCatalog,
  reorderFeeGroups,
  saveFeeProvider,
  saveFeeGroup,
  removeFeeResource,
} from "../services/card-fee-management"
import type { ProviderForm, GroupForm } from "../management-schemas"

type SaveCommand =
  | { kind: "provider"; data: ProviderForm; id?: string }
  | { kind: "group"; data: GroupForm; id?: string }

export function useFeeManagement(userId: string, organizationId: string) {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: [...cardFeeKeys.all, "catalog", userId, organizationId],
    queryFn: ({ signal }) => listFeeCatalog(signal),
  })
  const mutation = useMutation({
    mutationFn: async (command: SaveCommand): Promise<{ id: string }> => {
      switch (command.kind) {
        case "provider":
          return saveFeeProvider(command.data, command.id)
        case "group":
          return saveFeeGroup(command.data, command.id)
      }
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: cardFeeKeys.all })
      toastManager.add({ title: "Alterações salvas", type: "success" })
    },
    onError: (error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      toastManager.add({
        title: "Não foi possível salvar",
        description:
          status === 409
            ? "Já existe um provedor com esse nome ou uma taxa para esse parcelamento."
            : status === 403
              ? "Você não tem permissão para alterar as taxas."
              : "Confira os dados e sua conexão. Suas edições foram mantidas.",
        type: "error",
      })
    },
  })

  const removal = useMutation({
    mutationFn: ({ kind, id }: { kind: "provider" | "group"; id: string }) =>
      removeFeeResource(kind, id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: cardFeeKeys.all })
      toastManager.add({ title: "Registro removido", type: "success" })
    },
    onError: (error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      toastManager.add({
        title: "Não foi possível remover",
        description:
          status === 409
            ? "Remova os grupos deste provedor antes de removê-lo."
            : status === 403
              ? "Você não tem permissão para remover este registro."
              : "Confira sua conexão e tente novamente.",
        type: "error",
      })
    },
  })

  const reordering = useMutation({
    mutationFn: ({
      providerId,
      groupIds,
    }: {
      providerId: string
      groupIds: string[]
    }) => reorderFeeGroups(providerId, groupIds),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: cardFeeKeys.all })
    },
    onError: (error) => {
      const status = isAxiosError(error) ? error.response?.status : undefined
      toastManager.add({
        title: "Não foi possível reordenar",
        description:
          status === 409
            ? "A lista de grupos mudou. Atualize os dados e tente novamente."
            : status === 403
              ? "Você não tem permissão para reordenar os grupos."
              : "Confira sua conexão e tente novamente. A ordem anterior foi mantida.",
        type: "error",
      })
    },
  })

  return { query, mutation, removal, reordering }
}
