"use client"

import { CreditCard, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { svgDataUrl } from "@/app/(private)/taxas/logo"
import type { FeeBrand, FeeProvider } from "../schemas"

const previewLimit = 3

function Logo({ svg, className }: { svg: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={svgDataUrl(svg)}
      alt=""
      aria-hidden="true"
      className={className}
    />
  )
}

export function ProviderCard({
  provider,
  brands,
  canEdit,
  onOpen,
  onRemove,
}: {
  provider: FeeProvider
  /** Grupos do provedor, já na ordem de exibição. */
  brands: FeeBrand[]
  canEdit: boolean
  onOpen: () => void
  onRemove: () => void
}) {
  const hidden = brands.length - previewLimit

  return (
    <div className="relative h-full min-w-0 rounded-lg border bg-card text-card-foreground transition-[color,background-color,border-color,scale] duration-150 hover:border-foreground/20 hover:bg-muted/20 has-[[data-slot=provider-card-action]:active]:scale-[0.98] motion-reduce:transition-none">
      <button
        type="button"
        data-slot="provider-card-action"
        onClick={onOpen}
        aria-label={`Abrir ${provider.name}`}
        className="flex h-full w-full cursor-pointer flex-col gap-4 rounded-lg p-4 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex items-center gap-3 pr-8">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted/30 p-1.5">
            {provider.logo ? (
              <Logo
                svg={provider.logo}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <CreditCard
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            )}
          </span>
          <span className="grid min-w-0">
            <span className="truncate font-semibold">{provider.name}</span>
            <span className="text-xs text-muted-foreground">
              {brands.length === 1
                ? "1 grupo de taxas"
                : `${brands.length} grupos de taxas`}
            </span>
          </span>
        </span>

        {brands.length ? (
          <span className="grid gap-1.5">
            {brands.slice(0, previewLimit).map((brand) => (
              <span
                key={brand.id}
                className="flex min-w-0 items-center gap-2 text-sm"
              >
                <span className="flex h-4 w-10 shrink-0 items-center justify-center">
                  {brand.logo ? (
                    <Logo
                      svg={brand.logo}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <CreditCard
                      className="size-3.5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate" title={brand.name}>
                  {brand.name}
                </span>
                <span className="shrink-0 rounded-md border bg-muted/40 px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground">
                  {brand.channel}
                </span>
              </span>
            ))}
            {hidden > 0 && (
              <span className="pl-12 text-xs text-muted-foreground">
                {hidden === 1 ? "+1 grupo" : `+${hidden} grupos`}
              </span>
            )}
          </span>
        ) : (
          <span className="rounded-md border border-dashed px-3 py-3 text-center text-xs text-muted-foreground">
            Nenhum grupo de taxas cadastrado.
          </span>
        )}
      </button>
      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <IconButton
                label={`Opções de ${provider.name}`}
                variant="ghost"
                size="icon-sm"
                className="absolute top-3 right-3 text-muted-foreground"
              />
            }
          >
            <MoreHorizontal aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-40 translate-y-0 scale-100 opacity-100 transition-[opacity,scale,translate] duration-200 ease-out data-ending-style:-translate-y-1 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:-translate-y-1 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none"
          >
            <DropdownMenuItem onClick={onOpen}>
              <Pencil /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onRemove}>
              <Trash2 /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
