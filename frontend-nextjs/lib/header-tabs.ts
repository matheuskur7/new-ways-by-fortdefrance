import { settingsTabs } from "@/app/(private)/system-settings/tabs"

export type HeaderTabsConfig = {
  pathname: string
  label: string
  items: {
    value: string
    label: string
    href: string
    id: string
    panelId: string
  }[]
}

// Cada seção define suas abas no próprio domínio e as registra nesta lista.
const sections: HeaderTabsConfig[] = [settingsTabs]

export function resolveHeaderTabs(pathname: string) {
  return sections.find(
    (section) =>
      pathname === section.pathname || pathname.startsWith(`${section.pathname}/`)
  )
}
