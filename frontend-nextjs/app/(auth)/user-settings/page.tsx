import { PageHeader } from "@/components/page-header"
import Link from "next/link"
import { ArrowLeft, UserRound } from "lucide-react"
import { requireSession } from "@/lib/auth-server"
import { buttonVariants } from "@/components/ui/button"
import { UserSettingsForm } from "./components/user-settings-form"

export default async function SettingsPage() {
  const { user } = await requireSession()
  return (
    <div
      data-page-enter
      className="flex flex-1 animate-in flex-col gap-6 duration-300 fade-in-0 motion-reduce:animate-none"
    >
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
      <PageHeader
        icon={UserRound}
        title="Ajustes do usuário"
        subtitle="Seus dados pessoais e informações da conta."
      />
      <UserSettingsForm user={user} />
    </div>
  )
}
