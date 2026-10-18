"use client"

import { useEffect, useRef, type ReactNode } from "react"

export function AnimatedHeight({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const updateHeight = () => {
      container.style.height = `${content.getBoundingClientRect().height}px`
    }

    updateHeight()
    const observer = new ResizeObserver(updateHeight)
    observer.observe(content)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className="overflow-hidden transition-[height] duration-300 ease-in-out motion-reduce:transition-none"
    >
      <div ref={contentRef} className="flow-root">
        {children}
      </div>
    </div>
  )
}
