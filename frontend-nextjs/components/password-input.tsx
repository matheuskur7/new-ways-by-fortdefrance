"use client"

import { useState } from "react"
import type * as React from "react"
import { Eye, EyeOff } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/** Campo de senha com botão para mostrar ou ocultar o conteúdo. */
export function PasswordInput({
  id,
  className,
  disabled,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type"> & { id: string }) {
  const [visible, setVisible] = useState(false)
  const label = visible ? "Ocultar senha" : "Mostrar senha"
  return (
    <div className="relative">
      <Input
        {...props}
        id={id}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={cn("h-12 pr-12", className)}
      />
      <Tooltip>
        <TooltipTrigger className="absolute top-2 right-2" render={<span />}>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            aria-controls={id}
            aria-pressed={visible}
            disabled={disabled}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? (
              <EyeOff aria-hidden="true" />
            ) : (
              <Eye aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </div>
  )
}
