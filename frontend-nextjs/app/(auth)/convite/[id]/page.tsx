import Link from "next/link"
import { CalendarX2, MailOpen } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { StatusPanel } from "@/components/status-panel"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/ui/section-card"
import { invitationDetailsSchema } from "@/features/organization/schemas"
import { serverGet } from "@/lib/api-server"
import { getSession } from "@/lib/auth-server"
import { withNext } from "@/lib/redirect"
import { InvitationResponse } from "./_components/invitation-response"
import { WrongAccount } from "./_components/wrong-account"

async function InvitationContent({ id }: { id: string }) {
  const next = `/convite/${encodeURIComponent(id)}`
  const session = await getSession()

  if (!session)
    return (
      <StatusPanel
        icon={MailOpen}
        title="Você recebeu um convite"
        description="Entre com o e-mail que recebeu o convite para ver os detalhes e responder. Ainda não tem conta? Crie uma usando esse mesmo e-mail."
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={withNext("/cadastro", next)} />}
        >
          Criar conta
        </Button>
        <Button
          nativeButton={false}
          render={<Link href={withNext("/entrar", next)} />}
        >
          Entrar
        </Button>
      </StatusPanel>
    )

  const response = await serverGet(
    `/api/auth/organization/get-invitation?id=${encodeURIComponent(id)}`
  )
  if (response.ok)
    return (
      <InvitationResponse
        invitation={invitationDetailsSchema.parse(await response.json())}
      />
    )

  const body: unknown = await response.json().catch(() => null)
  const code =
    body && typeof body === "object" && "code" in body ? body.code : undefined
  if (
    response.status === 403 &&
    code === "YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION"
  )
    return (
      <WrongAccount
        email={session.user.email}
        loginHref={withNext("/entrar", next)}
      />
    )
  if (response.status !== 400 && response.status !== 403)
    throw new Error("Não foi possível carregar o convite.")

  return (
    <StatusPanel
      icon={CalendarX2}
      tone="destructive"
      role="alert"
      title="Convite indisponível"
      description="O convite expirou, foi cancelado ou já foi respondido. Peça um novo convite a quem convidou você."
    >
      <Button nativeButton={false} render={<Link href="/empresas" />}>
        Ir para minhas empresas
      </Button>
    </StatusPanel>
  )
}

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        icon={MailOpen}
        title="Convite para empresa"
        subtitle="Participe da equipe de uma empresa no New Ways."
      />
      <SectionCard
        title="Detalhes do convite"
        description="Confira os dados antes de responder."
        className="gap-5"
      >
        <InvitationContent id={id} />
      </SectionCard>
    </div>
  )
}
