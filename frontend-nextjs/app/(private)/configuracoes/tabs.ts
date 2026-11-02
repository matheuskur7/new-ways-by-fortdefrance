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
  ],
}
