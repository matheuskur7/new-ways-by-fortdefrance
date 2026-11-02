"use client"
import { Button } from "@/components/ui/button"
import type { ManagedProvider } from "../management-schemas"

export function ProviderList({
  providers,
  selectedId,
  onSelect,
}: {
  providers: ManagedProvider[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div
      className="flex min-w-0 flex-wrap items-center gap-2"
      role="group"
      aria-label="Selecionar provedor de taxas"
    >
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant={provider.id === selectedId ? "secondary" : "ghost"}
          className={`h-auto min-h-9 max-w-full border px-3 text-left wrap-break-word whitespace-normal ${provider.id === selectedId ? "border-primary/20 bg-primary/5 text-primary hover:bg-primary/10" : "border-transparent"}`}
          aria-pressed={provider.id === selectedId}
          onClick={() => onSelect(provider.id)}
        >
          {provider.name}
        </Button>
      ))}
    </div>
  )
}
