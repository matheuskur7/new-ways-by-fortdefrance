import type { HeaderTabsConfig } from "@/lib/header-tabs"

export const settingsTabs: HeaderTabsConfig = {
  pathname: "/configuracoes",
  label: "Configurações do Sistema",
  items: [
    {
      value: "general",
      label: "Geral",
      href: "/configuracoes",
      id: "settings-general-tab",
      panelId: "settings-general-panel",
    },
    {
      value: "fees",
      label: "Taxas",
      href: "/configuracoes/taxas",
      id: "settings-fees-tab",
      panelId: "settings-fees-panel",
    },
  ],
}
