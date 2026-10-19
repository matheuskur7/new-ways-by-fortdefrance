"use client"

import { usePathname, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs"

export function SettingsNavigation() {
  const pathname = usePathname()
  const router = useRouter()
  const active = pathname === "/system-settings/taxas" ? "fees" : "general"
  return (
    <Tabs
      className="self-stretch"
      value={active}
      onValueChange={(value) =>
        router.push(
          value === "fees" ? "/system-settings/taxas" : "/system-settings"
        )
      }
    >
      <TabsList
        variant="underline"
        aria-label="Configurações do Sistema"
        className="h-full"
      >
        <TabsTab
          className="my-0 h-full rounded-b-none sm:h-full"
          id="settings-general-tab"
          aria-controls="settings-general-panel"
          value="general"
        >
          Geral
        </TabsTab>
        <TabsTab
          className="my-0 h-full rounded-b-none sm:h-full"
          id="settings-fees-tab"
          aria-controls="settings-fees-panel"
          value="fees"
        >
          Taxas
        </TabsTab>
      </TabsList>
    </Tabs>
  )
}
