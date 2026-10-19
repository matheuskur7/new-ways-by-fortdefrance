"use client"

import { usePathname, useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTab } from "@/components/ui/tabs"
import { resolveHeaderTabs } from "@/lib/header-tabs"

export function HeaderTabs() {
  const pathname = usePathname()
  const router = useRouter()
  const section = resolveHeaderTabs(pathname)

  if (!section) return null

  // A correspondência mais específica mantém a aba ativa em suas subpáginas.
  const active = section.items
    .filter(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]

  return (
    <Tabs
      className="self-stretch"
      value={active?.value ?? null}
      onValueChange={(value) => {
        const item = section.items.find((item) => item.value === value)
        if (item) router.push(item.href)
      }}
    >
      <TabsList
        variant="underline"
        aria-label={section.label}
        className="h-full"
      >
        {section.items.map((item) => (
          <TabsTab
            key={item.href}
            className="my-0 h-full rounded-b-none sm:h-full"
            id={item.id}
            aria-controls={item.panelId}
            value={item.value}
          >
            {item.label}
          </TabsTab>
        ))}
      </TabsList>
    </Tabs>
  )
}
