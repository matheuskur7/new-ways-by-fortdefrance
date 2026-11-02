"use client"

import { useEffect, useState, ViewTransition, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import {
  clearTabNavigation,
  isTabNavigation,
  tabTransitionTypes,
} from "@/lib/tab-navigation"

// Só as trocas de aba (tipos definidos em HeaderTabs) deslizam o conteúdo;
// as demais navegações mantêm a animação de entrada do contêiner.
const tabSlide = {
  [tabTransitionTypes.forward]: tabTransitionTypes.forward,
  [tabTransitionTypes.back]: tabTransitionTypes.back,
  default: "none",
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <ViewTransition
      key={pathname}
      enter={tabSlide}
      exit={tabSlide}
      default="none"
    >
      <PageContent pathname={pathname}>{children}</PageContent>
    </ViewTransition>
  )
}

function PageContent({
  pathname,
  children,
}: {
  pathname: string
  children: ReactNode
}) {
  const [tabNavigation] = useState(() => isTabNavigation(pathname))

  useEffect(() => clearTabNavigation(pathname), [pathname])

  return (
    <div
      className={`flex flex-1 flex-col ${tabNavigation ? "" : "animate-in duration-300 ease-out fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none"}`}
    >
      {children}
    </div>
  )
}
