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
          <SelectValue placeholder="Selecione um provedor" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            <SelectLabel>Provedor de taxas</SelectLabel>
            {items.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
