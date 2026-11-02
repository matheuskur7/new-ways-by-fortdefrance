"use client"

import { useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { LoaderCircle, MailPlus } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { toastManager } from "@/components/ui/toast"
import { mutationErrorToast } from "@/lib/mutation-error"
import {
  RESEND_COOLDOWN_SECONDS,
  resendVerification,
} from "../services/resend-verification"

const showError = mutationErrorToast({
  title: "Não foi possível reenviar o e-mail",
  messages: {
    429: "Muitas solicitações. Aguarde alguns instantes e tente novamente.",
  },
  fallback: "Confira sua conexão e tente novamente.",
})

/**
 * Reenvia o link de confirmação de e-mail, com contagem regressiva entre os
 * pedidos. `sentRecently` inicia a contagem quando um link acabou de ser enviado.
 */
export function ResendVerificationButton({
  email,
  next,
  sentRecently = false,
  variant = "outline",
  className,
}: {
  email: string
  next: string
  sentRecently?: boolean
  variant?: "outline" | "default" | "secondary"
  className?: string
}) {
  const [availableAt, setAvailableAt] = useState(() =>
    sentRecently ? Date.now() + RESEND_COOLDOWN_SECONDS * 1000 : 0
  )
  const [now, setNow] = useState(() => Date.now())
  const remaining = Math.max(0, Math.ceil((availableAt - now) / 1000))

  useEffect(() => {
    if (remaining === 0) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [remaining])

  const resend = useMutation({
    mutationFn: () => resendVerification(email, next),
    onSuccess: () => {
      const sentAt = Date.now()
      setNow(sentAt)
      setAvailableAt(sentAt + RESEND_COOLDOWN_SECONDS * 1000)
      toastManager.add({
        title: "E-mail reenviado",
        description: `Se a conta de ${email} ainda não foi confirmada, um novo link chegará em instantes.`,
        type: "success",
      })
    },
    onError: showError,
  })

  return (
    <Button
      type="button"
      variant={variant}
      className={cn(className)}
      disabled={resend.isPending || remaining > 0}
      aria-busy={resend.isPending}
      onClick={() => resend.mutate()}
    >
      {resend.isPending ? (
        <LoaderCircle
          className="animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
      ) : (
        <MailPlus aria-hidden="true" />
      )}
      {resend.isPending
        ? "Reenviando…"
        : remaining > 0
          ? `Reenviar em ${remaining}s`
          : "Reenviar e-mail"}
    </Button>
  )
}
