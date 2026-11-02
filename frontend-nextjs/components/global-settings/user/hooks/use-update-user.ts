"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"
import { toastManager } from "@/components/ui/toast"
import { requestSessionCheck } from "@/lib/session-events"
import { updateUser } from "../services/update-user"

export function useUpdateUser() {
  const router = useRouter()
  return useMutation({
    mutationKey: ["update-user"],
    mutationFn: updateUser,
    onSuccess: () => {
      requestSessionCheck()
      router.refresh()
      toastManager.add({
        title: "Perfil atualizado",
        description: "Suas alterações foram salvas.",
        type: "success",
      })
    },
    onError: (error) => {
      toastManager.add({
        title: "Não foi possível salvar",
        description:
          isAxiosError(error) && error.response?.status === 403
            ? "Você não tem permissão para atualizar este perfil."
            : "Confira sua conexão e tente novamente. Suas edições foram mantidas.",
        type: "error",
      })
    },
  })
}
