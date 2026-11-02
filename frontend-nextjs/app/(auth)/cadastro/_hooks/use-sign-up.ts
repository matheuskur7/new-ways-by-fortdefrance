"use client"

import { useMutation } from "@tanstack/react-query"
import { signUp } from "../_services/sign-up"
import type { SignUpFormData } from "../schemas"

export function useSignUp(next: string) {
  return useMutation({
    mutationFn: (data: SignUpFormData) => signUp(data, next),
    // O resultado e as falhas são exibidos no próprio formulário.
  })
}
