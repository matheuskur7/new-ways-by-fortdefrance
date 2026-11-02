import Link from "next/link"
import { LogIn } from "lucide-react"
import { PageHeaderIcon } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import LoginForm from "./_components/login-form"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"
import { safeNextPath, withNext } from "@/lib/redirect"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { next: rawNext } = await searchParams
  const next = rawNext === undefined ? undefined : safeNextPath(rawNext)
  if (await getSession()) {
    redirect(safeNextPath(next))
  }

  return (
    <div className="grid flex-1 grid-rows-[1fr_auto_1fr] gap-6">
      <div className="grid gap-2 self-start">
        <header className="flex items-center gap-4">
          <PageHeaderIcon icon={LogIn} />
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              Bem-vindo de volta
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Entre na sua conta
            </h1>
          </div>
        </header>
        <p className="text-sm text-muted-foreground">
          Use seu e-mail e sua senha para acessar o sistema.
        </p>
      </div>
      <LoginForm next={safeNextPath(next)} />
      <footer className="-mb-4 grid gap-6 self-end">
        <p className="text-center text-sm text-muted-foreground">
          Ainda não possui uma conta?{" "}
          <Button
            variant="link"
            className="h-auto p-0 underline"
            nativeButton={false}
            render={<Link href={withNext("/cadastro", next)} />}
          >
            Criar conta
          </Button>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Seu acesso é pessoal. Mantenha sua senha em segurança.
        </p>
      </footer>
    </div>
  )
}
