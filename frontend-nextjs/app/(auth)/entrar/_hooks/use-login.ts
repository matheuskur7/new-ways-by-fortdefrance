"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { toastManager } from "@/components/ui/toast"
import { login } from "../_services/login"

export function useLogin(next: string) {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      queryClient.clear()
      toastManager.add({
        title: "Login realizado!",
        description: "Bem-vindo ao sistema.",
        type: "success",
      })

      router.replace(next)
    },
    // A falha é exibida no próprio formulário, junto aos campos.
  })
}
