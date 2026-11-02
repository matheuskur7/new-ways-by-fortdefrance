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

  // A chave da seção faz as abas animarem ao entrar em uma seção com abas,
  // mas não ao trocar de aba dentro dela.
  return (
    <Tabs
      key={section.pathname}
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
        className="h-full *:data-[slot=tab-indicator]:animate-in *:data-[slot=tab-indicator]:fade-in-0 *:data-[slot=tab-indicator]:[--tw-animation-duration:300ms] motion-reduce:*:data-[slot=tab-indicator]:animate-none"
      >
        {section.items.map((item, index) => (
          <TabsTab
            key={item.href}
            className="my-0 h-full animate-in rounded-b-none fade-in-0 fill-mode-[both] [--tw-animation-duration:300ms] slide-in-from-top-1 motion-reduce:animate-none sm:h-full"
            style={{ animationDelay: `${index * 60}ms` }}
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
