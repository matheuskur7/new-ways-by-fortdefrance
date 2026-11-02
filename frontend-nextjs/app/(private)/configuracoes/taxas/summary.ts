import type { FeeSettings } from "./schemas"

/** Grupos de um provedor na ordem de exibição. */
export function providerBrands(settings: FeeSettings, providerId?: string) {
  return settings.brands
    .filter((brand) => brand.providerId === providerId)
    .sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)
    )
}

export type SettingsOverview = {
  providerCount: number
  brandCount: number
  /** Alteração mais recente entre provedores e grupos, com o que foi alterado. */
  lastChange: { at: string; label: string } | null
}

/** Totais exibidos no resumo do topo da tela de taxas. */
export function settingsOverview(settings: FeeSettings): SettingsOverview {
  const names = new Map(
    settings.providers.map((provider) => [provider.id, provider.name])
  )
  const changes = [
    ...settings.providers.map((provider) => ({
      at: provider.updatedAt,
      label: provider.name,
    })),
    ...settings.brands.map((brand) => ({
      at: brand.updatedAt,
      label: `${brand.name} · ${names.get(brand.providerId) ?? "Provedor"}`,
    })),
  ]
  const lastChange = changes.reduce<SettingsOverview["lastChange"]>(
    (latest, change) =>
      !latest || Date.parse(change.at) > Date.parse(latest.at)
        ? change
        : latest,
    null
  )
  return {
    providerCount: settings.providers.length,
    brandCount: settings.brands.length,
    lastChange,
  }
}
