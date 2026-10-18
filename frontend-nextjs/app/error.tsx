"use client"

import { Button } from "@/components/ui/button"

export default function PageError({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">
        Não foi possível carregar a página
      </h1>
      <p className="text-muted-foreground">
        Confira sua conexão e tente novamente. Sua sessão não foi encerrada.
      </p>
      <Button onClick={() => retry()}>Tentar novamente</Button>
    </main>
  )
}
