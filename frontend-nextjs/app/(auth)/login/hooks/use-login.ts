"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { isAxiosError } from "axios"

import { toastManager } from "@/components/ui/toast"
import { login } from "../services/login"

export function useLogin() {
  const router = useRouter()

  return useMutation({
    mutationFn: login,
    onSuccess: () => {
      toastManager.add({
        title: "Login realizado!",
        description: "Bem-vindo ao sistema.",
        type: "success",
      })

      router.replace("/organizations")
    },
    onError: (error) => {
      const message = isAxiosError(error) && error.response?.data?.message

      toastManager.add({
        title: "Não foi possível entrar",
        description:
          message === "Invalid email or password"
            ? "Email e/ou senha inválido(s)."
            : message || "Tente novamente mais tarde.",
        type: "error",
      })
    },
  })
}