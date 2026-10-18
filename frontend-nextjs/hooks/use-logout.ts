"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toastManager } from "@/components/ui/toast"
import { signOut } from "@/lib/logout"

export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: ["logout"],
    mutationFn: signOut,
    onSuccess: async () => {
      await queryClient.cancelQueries()
      queryClient.clear()
      toastManager.add({
        id: "logout-success",
        title: "Você saiu da sua conta",
        type: "info",
      })
      router.replace("/login")
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
