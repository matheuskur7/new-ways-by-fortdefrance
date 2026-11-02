"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toastManager } from "@/components/ui/toast"
import { mutationErrorToast } from "@/lib/mutation-error"
import { cardFeeKeys } from "@/features/card-fees/hooks/query-keys"
import {
  listFeeSettings,
  removeBrand,
  removeProvider,
  reorderBrands,
  saveBrand,
  saveProvider,
} from "../_services/fee-settings"
import type { BrandForm, ProviderForm } from "../schemas"

function failure(
  title: string,
  messages: Partial<Record<number, string>>,
  fallback: string
) {
  return mutationErrorToast({
    title,
    fallback,
    messages: {
      403: "Você não tem permissão para alterar as taxas.",
      ...messages,
    },
  })
}

export function useFeeSettings(userId: string, organizationId: string) {
  const client = useQueryClient()
  // Atualiza também a calculadora, que lê as mesmas taxas.
  const refresh = () =>
    client.invalidateQueries({
      queryKey: cardFeeKeys.scope(userId, organizationId),
    })

  const query = useQuery({
    queryKey: cardFeeKeys.settings(userId, organizationId),
    queryFn: ({ signal }) => listFeeSettings(signal),
  })

  const providerSaving = useMutation({
    mutationFn: ({ data, id }: { data: ProviderForm; id?: string }) =>
      saveProvider(data, id),
    // O modal confirma o sucesso depois de salvar também a ordem dos grupos.
    onSuccess: refresh,
    onError: failure(
      "Não foi possível salvar o provedor",
      { 409: "Já existe um provedor com esse nome." },
      "Confira os dados e sua conexão. Suas edições foram mantidas."
    ),
  })

  const providerRemoval = useMutation({
    mutationFn: removeProvider,
    onSuccess: async () => {
      await refresh()
      toastManager.add({ title: "Provedor removido", type: "success" })
    },
    onError: failure(
      "Não foi possível remover o provedor",
      {
        409: "Este provedor ganhou grupos de taxas. Atualize a página e remova-os antes.",
      },
      "Confira sua conexão e tente novamente."
    ),
  })

  const brandSaving = useMutation({
    mutationFn: ({
      providerId,
      displayOrder,
      data,
      id,
    }: {
      providerId: string
      displayOrder: number
      data: BrandForm
      id?: string
    }) => saveBrand(providerId, displayOrder, data, id),
    onSuccess: async () => {
      await refresh()
      toastManager.add({ title: "Grupo de taxas salvo", type: "success" })
    },
    onError: failure(
      "Não foi possível salvar o grupo",
      {},
      "Confira os dados e sua conexão. Suas edições foram mantidas."
    ),
  })

  const brandRemoval = useMutation({
    mutationFn: removeBrand,
    onSuccess: async () => {
      await refresh()
      toastManager.add({ title: "Grupo de taxas removido", type: "success" })
    },
    onError: failure(
      "Não foi possível remover o grupo",
      {},
      "Confira sua conexão e tente novamente."
    ),
  })

  const reordering = useMutation({
    mutationFn: ({
      providerId,
      brandIds,
    }: {
      providerId: string
      brandIds: string[]
    }) => reorderBrands(providerId, brandIds),
    onSuccess: refresh,
    onError: failure(
      "Não foi possível reordenar",
      { 409: "A lista de grupos mudou. Atualize os dados e tente novamente." },
      "Confira sua conexão e tente novamente. A nova ordem continua pendente."
    ),
  })

  return {
    query,
    providerSaving,
    providerRemoval,
    brandSaving,
    brandRemoval,
    reordering,
  }
}
