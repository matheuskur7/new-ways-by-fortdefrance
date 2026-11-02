"use client"

import { History, Layers3, Store } from "lucide-react"
import { formatTimestamp } from "@/components/entity-timestamps"
import { SectionCard } from "@/components/ui/section-card"
import { Skeleton } from "@/components/ui/skeleton"
import type { FeeSettings } from "../schemas"
import { settingsOverview } from "../summary"

function Value({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-2xl leading-none font-semibold tabular-nums">
      {children}
    </p>
  )
}

export function SettingsOverview({ settings }: { settings?: FeeSettings }) {
  const overview = settings ? settingsOverview(settings) : null
  const loading = <Skeleton className="h-6 w-16" />

  return (
    <div
      className="grid gap-3 sm:grid-cols-3"
      aria-busy={!overview}
      aria-label="Resumo das taxas"
      role="group"
    >
      <SectionCard className="gap-3" icon={Store} title="Provedores">
        {overview ? <Value>{overview.providerCount}</Value> : loading}
      </SectionCard>
      <SectionCard className="gap-3" icon={Layers3} title="Grupos de taxas">
        {overview ? <Value>{overview.brandCount}</Value> : loading}
      </SectionCard>
      <SectionCard className="gap-3" icon={History} title="Última alteração">
        {!overview ? (
          loading
        ) : overview.lastChange ? (
          <div className="grid min-w-0 gap-1">
            <p className="text-base leading-none font-semibold tabular-nums">
              <time dateTime={new Date(overview.lastChange.at).toISOString()}>
                {formatTimestamp(overview.lastChange.at)}
              </time>
            </p>
            <p
              className="truncate text-xs text-muted-foreground"
              title={overview.lastChange.label}
            >
              {overview.lastChange.label}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma alteração.</p>
        )}
      </SectionCard>
    </div>
  )
}
