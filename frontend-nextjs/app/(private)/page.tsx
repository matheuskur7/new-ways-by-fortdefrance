import { House } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { requireSession } from "@/lib/auth-server"

export default async function Page() {
  await requireSession()
  return (
    <PageHeader
      icon={House}
      title="Início"
      subtitle="Seu espaço de trabalho."
    />
  )
}
