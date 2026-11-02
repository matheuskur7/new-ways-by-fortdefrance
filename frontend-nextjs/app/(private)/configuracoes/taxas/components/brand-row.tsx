"use client"

import type { ReactNode } from "react"
import { CreditCard, Pencil, Trash2 } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { svgDataUrl } from "@/features/card-fees/logo"
import type { FeeBrand } from "../schemas"

export function BrandRow({
  brand,
  dragHandle,
  actions,
}: {
  brand: FeeBrand
  dragHandle?: ReactNode
  actions?: { onEdit: () => void; onRemove: () => void; disabled: boolean }
}) {
  const installments = brand.rates.length
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      {dragHandle}
      <span className="flex h-8 w-14 shrink-0 items-center justify-center">
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={svgDataUrl(brand.logo)}
            alt=""
            aria-hidden="true"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <CreditCard
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium wrap-break-word">{brand.name}</p>
        <p className="text-xs text-muted-foreground">
          {brand.channel} ·{" "}
          {installments === 1 ? "1 parcela" : `${installments} parcelas`}
        </p>
      </div>
      {actions && (
        <div className="flex shrink-0 gap-1">
          <IconButton
            label={`Editar ${brand.name}`}
            tooltip="Editar"
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={actions.disabled}
            onClick={actions.onEdit}
          >
            <Pencil aria-hidden="true" />
          </IconButton>
          <IconButton
            label={`Remover ${brand.name}`}
            tooltip="Remover"
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={actions.disabled}
            onClick={actions.onRemove}
          >
            <Trash2 aria-hidden="true" />
          </IconButton>
        </div>
      )}
    </div>
  )
}
