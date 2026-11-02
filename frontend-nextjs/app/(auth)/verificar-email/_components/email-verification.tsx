"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { CircleCheck, LinkIcon, LoaderCircle } from "lucide-react"
import { StatusPanel } from "@/components/status-panel"
import { Button } from "@/components/ui/button"
import { withNext } from "@/lib/redirect"
import { verifyEmail } from "../_services/verify-email"

export function InvalidVerificationLink({ next }: { next: string }) {
  return (
    <StatusPanel
      icon={LinkIcon}
      tone="destructive"
      role="alert"
      title="Link inválido ou expirado"
      description="Não foi possível confirmar seu e-mail com este link. Entre com seu e-mail e senha para pedir um novo link de confirmação."
    >
      <Button
        nativeButton={false}
        render={<Link href={withNext("/entrar", next)} />}
      >
        Ir para o login
      </Button>
    </StatusPanel>
  )
}

export function EmailVerification({
  token,
  next,
}: {
  token: string
  next: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  // A consulta deduplica a confirmação mesmo com efeitos repetidos em desenvolvimento.
  const verification = useQuery({
    queryKey: ["email-verification", token],
    queryFn: ({ signal }) => verifyEmail(token, signal),
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })

  if (verification.isPending)
    return (
      <StatusPanel
        icon={LoaderCircle}
        tone="info"
        title="Confirmando seu e-mail…"
        description="Aguarde um instante enquanto validamos o link."
        className="[&_svg]:animate-spin motion-reduce:[&_svg]:animate-none"
      />
    )

  if (verification.isError) return <InvalidVerificationLink next={next} />

  return (
    <StatusPanel
      icon={CircleCheck}
      tone="success"
      title="E-mail confirmado"
      description="Sua conta está ativa e você já pode usar o sistema."
    >
      <Button
        autoFocus
        onClick={() => {
          queryClient.clear()
          router.replace(next)
          router.refresh()
        }}
      >
        Continuar
      </Button>
    </StatusPanel>
  )
}
