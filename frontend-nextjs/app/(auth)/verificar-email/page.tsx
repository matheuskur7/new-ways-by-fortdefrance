import { MailCheck } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { SectionCard } from "@/components/ui/section-card"
import { safeNextPath } from "@/lib/redirect"
import {
  EmailVerification,
  InvalidVerificationLink,
} from "./_components/email-verification"

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { token, next: rawNext } = await searchParams
  const next = safeNextPath(rawNext)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        icon={MailCheck}
        title="Confirmação de e-mail"
        subtitle="Validamos o link enviado para o seu e-mail."
      />
      <SectionCard
        title="Status da confirmação"
        className="gap-5"
      >
        {typeof token === "string" && token ? (
          <EmailVerification token={token} next={next} />
        ) : (
          <InvalidVerificationLink next={next} />
        )}
      </SectionCard>
    </div>
  )
}
