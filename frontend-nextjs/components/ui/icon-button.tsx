"use client"

import type { ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function IconButton({
  label,
  tooltip,
  children,
  size = "icon",
  tooltipSide,
  ...props
}: ComponentProps<typeof Button> & {
  label: string
  /** Texto visível do tooltip; por padrão, o mesmo do `label` (lido por leitores de tela). */
  tooltip?: string
  tooltipSide?: ComponentProps<typeof TooltipContent>["side"]
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button size={size} {...props} aria-label={label} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{tooltip ?? label}</TooltipContent>
    </Tooltip>
  )
}
