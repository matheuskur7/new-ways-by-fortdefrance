"use client"

import { CircleAlert } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"

export default function PageError({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <PageHeader
        className="max-w-xl"
        icon={CircleAlert}
        title="Não foi possível carregar a página"
        subtitle="Confira sua conexão e tente novamente. Sua sessão não foi encerrada."
      />
      <Button onClick={() => retry()}>Tentar novamente</Button>
    </main>
  )
}
