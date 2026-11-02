import Link from "next/link"
import { redirect } from "next/navigation"
import { UserRoundPlus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/ui/section-card"
import { getSession } from "@/lib/auth-server"
import { safeNextPath, withNext } from "@/lib/redirect"
import { SignUpForm } from "./_components/sign-up-form"

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { next: rawNext } = await searchParams
  const next = rawNext === undefined ? undefined : safeNextPath(rawNext)
  if (await getSession()) redirect(safeNextPath(next))
  const loginHref = withNext("/entrar", next)

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        icon={UserRoundPlus}
        title="Criar conta"
        subtitle="Cadastre-se e confirme seu e-mail para acessar o sistema."
      />
      <SectionCard
        title="Seus dados"
        description="Você receberá um link para confirmar o e-mail."
        className="gap-5"
      >
        <SignUpForm next={safeNextPath(next)} loginHref={loginHref} />
      </SectionCard>
      <p className="mt-auto pt-2 text-center text-sm text-muted-foreground">
        Já possui uma conta?{" "}
        <Button
          variant="link"
          className="h-auto p-0 underline"
          nativeButton={false}
          render={<Link href={loginHref} />}
        >
          Entrar
        </Button>
      </p>
    </div>
  )
}
