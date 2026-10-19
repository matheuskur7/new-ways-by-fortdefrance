import type { HeaderTabsConfig } from "@/lib/header-tabs"

export const settingsTabs: HeaderTabsConfig = {
  pathname: "/system-settings",
  label: "Configurações do Sistema",
  items: [
    {
      value: "general",
      label: "Geral",
      href: "/system-settings",
      id: "settings-general-tab",
      panelId: "settings-general-panel",
    },
    {
      value: "fees",
      label: "Taxas",
      href: "/system-settings/taxas",
      id: "settings-fees-tab",
      panelId: "settings-fees-panel",
    },
  ],
}
