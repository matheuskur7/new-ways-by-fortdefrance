"use client"

import {
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toastManager } from "@/components/ui/toast"
import { enterOrganizationMutationKey } from "@/features/organization/hooks/query-keys"
import { signOut } from "../logout"

export const logoutMutationKey = ["logout"] as const

/** `loginHref` permite voltar a um fluxo, como um convite, depois de entrar novamente. */
export function useLogout(loginHref = "/entrar") {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: logoutMutationKey,
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.cancelQueries()
      queryClient.clear()
      toastManager.add({
        id: "logout-success",
        title: "Você saiu da sua conta",
        type: "info",
      })
      router.replace(loginHref)
    },
    onError: () => {
      toastManager.add({
        id: "logout-error",
        title: "Não foi possível sair",
        description: "Confira sua conexão e tente novamente.",
        type: "error",
      })
    },
  })
}

/**
 * Saída da conta pelos menus do usuário. `disabled` também bloqueia ações da
 * conta enquanto a saída ou a troca de empresa estiverem em andamento.
 */
export function useLogoutAction(loginHref?: string) {
  const logout = useLogout(loginHref)
  const pendingSelections = useIsMutating({
    mutationKey: enterOrganizationMutationKey,
  })
  return {
    logout,
    disabled: logout.isPending || logout.isSuccess || pendingSelections > 0,
  }
}
