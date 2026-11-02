import { KeyRound } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { SectionCard } from "@/components/ui/section-card"
import {
  InvalidResetLink,
  ResetPasswordForm,
} from "./_components/reset-password-form"

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { token } = await searchParams

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        icon={KeyRound}
        title="Redefinir senha"
        subtitle="Crie uma nova senha para acessar sua conta."
      />
      <SectionCard
        title="Nova senha"
        description="Use pelo menos 8 caracteres."
        className="gap-5"
      >
        {typeof token === "string" && token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <InvalidResetLink />
        )}
      </SectionCard>
    </div>
  )
}
