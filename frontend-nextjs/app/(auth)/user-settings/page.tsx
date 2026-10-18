import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireSession } from "@/lib/auth-server"
import { buttonVariants } from "@/components/ui/button"
import { UserSettingsForm } from "./components/user-settings-form"

export default async function SettingsPage() {
  const { user } = await requireSession()
  return (
    <div className="flex flex-1 animate-in flex-col gap-6 duration-300 fade-in-0 motion-reduce:animate-none">
      <Link
        href="/organizations"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "-ml-2.5 self-start",
        })}
      >
        <ArrowLeft aria-hidden="true" /> Minhas empresas
      </Link>
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Ajustes do usuário
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seus dados pessoais e informações da conta.
        </p>
      </header>
      <UserSettingsForm user={user} />
    </div>
  )
}
