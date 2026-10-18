import { Button } from "@/components/ui/button"
import LoginForm from "./components/login-form"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"

export default async function LoginPage() {
  if (await getSession()) {
    redirect("/organizations")
  }

  return (
    <div className="grid flex-1 grid-rows-[1fr_auto_1fr] gap-6">
      <header className="self-start">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          Bem-vindo de volta
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Entre na sua conta
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use seu e-mail e sua senha para acessar o sistema.
        </p>
      </header>
      <LoginForm />
      <footer className="-mb-4 grid gap-6 self-end">
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
