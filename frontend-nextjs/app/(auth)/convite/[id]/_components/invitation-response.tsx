"use client"

import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, LoaderCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toastManager } from "@/components/ui/toast"
import { mutationErrorToast } from "@/lib/mutation-error"
import { organizationKeys } from "@/features/organization/hooks/query-keys"
import {
  acceptInvitation,
  rejectInvitation,
} from "@/features/organization/services/respond-invitation"
import {
  formatRoles,
  type InvitationDetails,
} from "@/features/organization/schemas"

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
})

const showError = mutationErrorToast({
  title: "Não foi possível responder ao convite",
  messages: {
    400: "O convite expirou ou já foi respondido. Peça um novo convite.",
    403: "Este convite não pode ser respondido por esta conta.",
  },
  fallback: "Confira sua conexão e tente novamente.",
})

export function InvitationResponse({
  invitation,
}: {
  invitation: InvitationDetails
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const respond = useMutation({
    mutationFn: (accept: boolean) =>
      accept
        ? acceptInvitation(invitation.id)
        : rejectInvitation(invitation.id),
    onSuccess: async (_, accept) => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.all })
      toastManager.add({
        title: accept ? "Convite aceito" : "Convite recusado",
        description: accept
          ? `Agora você faz parte de ${invitation.organizationName}.`
          : "Quem convidou você não terá acesso à sua conta.",
        type: accept ? "success" : "info",
      })
      router.replace("/empresas")
      router.refresh()
    },
    onError: (error) => {
      showError(error)
      router.refresh()
    },
  })
  const pending = respond.isPending || respond.isSuccess
  const details = [
    { label: "Empresa", value: invitation.organizationName },
    { label: "Cargo", value: formatRoles(invitation.role) },
    { label: "Convidado por", value: invitation.inviterEmail },
    { label: "Válido até", value: dateFormat.format(invitation.expiresAt) },
  ]

  return (
    <div className="grid gap-6">
      <dl className="divide-y rounded-lg border bg-background px-4">
        {details.map((detail) => (
          <div
            key={detail.label}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3 text-sm"
          >
            <dt className="text-muted-foreground">{detail.label}</dt>
            <dd className="font-semibold break-all text-foreground">
              {detail.value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={pending}
          onClick={() => respond.mutate(false)}
        >
          {respond.isPending && respond.variables === false ? (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <X aria-hidden="true" />
          )}
          Recusar
        </Button>
        <Button
          type="button"
          size="lg"
          disabled={pending}
          onClick={() => respond.mutate(true)}
        >
          {respond.isPending && respond.variables === true ? (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <Check aria-hidden="true" />
          )}
          Aceitar convite
        </Button>
      </div>
    </div>
  )
}
