"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div
      key={pathname}
      className="flex flex-1 animate-in flex-col duration-300 ease-out fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none"
    >
      {children}
    </div>
  )
}
