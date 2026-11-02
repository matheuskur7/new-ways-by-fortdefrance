import Link from "next/link"
import { redirect } from "next/navigation"
import { KeyRound } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/ui/section-card"
import { getSession } from "@/lib/auth-server"
import { ForgotPasswordForm } from "./_components/forgot-password-form"

export default async function ForgotPasswordPage() {
  if (await getSession()) redirect("/empresas")

  return (
    // Conteúdo curto: o shell dispensa a altura mínima e centraliza o card.
    <div data-auth-shell="compact" className="flex flex-col gap-4">
      <PageHeader
        icon={KeyRound}
        title="Esqueci minha senha"
        subtitle="Receba por e-mail um link para criar uma nova senha."
      />
      <SectionCard
        title="Recuperar acesso"
        description="Informe o e-mail usado para entrar no sistema."
        className="gap-5"
      >
        <ForgotPasswordForm />
      </SectionCard>
      <p className="pt-2 text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Button
          variant="link"
          className="h-auto p-0 underline"
          nativeButton={false}
          render={<Link href="/entrar" />}
        >
          Voltar para o login
        </Button>
      </p>
    </div>
  )
}
