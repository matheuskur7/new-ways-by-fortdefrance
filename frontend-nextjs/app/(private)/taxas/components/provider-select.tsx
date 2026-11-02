"use client"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { FeeProvider } from "../schemas"
import { svgDataUrl } from "../logo"

function ProviderLabel({ provider }: { provider: FeeProvider }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      {provider.logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={svgDataUrl(provider.logo)}
          alt=""
          aria-hidden="true"
          className="size-5 shrink-0 object-contain"
        />
      )}
      <span className="truncate">{provider.name}</span>
    </span>
  )
}

export function ProviderSelect({
  providers,
  value,
  onChange,
  disabled,
}: {
  providers: FeeProvider[]
  value: string | null
  onChange: (value: string) => void
  disabled: boolean
}) {
  const items = providers.map((provider) => ({
    value: provider.id,
    label: provider.name,
  }))
  return (
    <div className="grid w-full gap-2 sm:w-52">
      <Label htmlFor="card-fee-provider">Provedor</Label>
      <Select
        items={items}
        value={value}
        disabled={disabled || !items.length}
        onValueChange={(id) => {
          if (id) onChange(id)
        }}
      >
        <SelectTrigger
          id="card-fee-provider"
          className="h-10 w-full shadow-none"
        >
          <SelectValue placeholder="Selecione um provedor">
            {(id: string | null) => {
              const provider = providers.find((item) => item.id === id)
              return provider ? (
                <ProviderLabel provider={provider} />
              ) : (
                "Selecione um provedor"
              )
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectLabel>Provedor de taxas</SelectLabel>
            {providers.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                <ProviderLabel provider={provider} />
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
