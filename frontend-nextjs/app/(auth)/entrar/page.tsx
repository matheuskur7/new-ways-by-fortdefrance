import { Button } from "@/components/ui/button"
import LoginForm from "./components/login-form"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"

export default async function LoginPage() {
  if (await getSession()) {
    redirect("/empresas")
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-10">
      <header className="grid gap-3">
        <p className="inline-flex w-fit items-center gap-2 text-xs font-semibold tracking-widest text-primary uppercase">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
          Bem-vindo de volta
        </p>
        <h1 className="text-4xl leading-tight font-semibold tracking-tight">
          Entre na sua conta
        </h1>
        <p className="text-base text-muted-foreground">
          Use seu e-mail e sua senha para acessar o sistema.
        </p>
      </header>
      <LoginForm />
      <footer className="grid gap-4 border-t pt-6">
        <p className="text-center text-sm text-muted-foreground">
          Ainda não possui uma conta?{" "}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 underline"
            disabled
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
