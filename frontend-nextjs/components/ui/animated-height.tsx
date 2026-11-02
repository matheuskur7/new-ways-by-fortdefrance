"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { cn } from "cn"

export function AnimatedHeight({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const updateHeight = () => {
      // Altura de layout: ignora transformações, como o zoom de entrada de um modal.
      container.style.height = `${content.offsetHeight}px`
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(content)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-hidden transition-[height] duration-300 ease-in-out motion-reduce:transition-none",
        className
      )}
    >
      <div ref={contentRef} className="flow-root">
        {children}
      </div>
    </div>
  )
}
