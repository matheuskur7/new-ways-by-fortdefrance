import type * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

export type StatusTone = "info" | "success" | "warning" | "destructive"

const toneClasses: Record<StatusTone, string> = {
  info: "border-info/20 bg-info/10 text-info",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  destructive: "border-destructive/20 bg-destructive/10 text-destructive",
}

/**
 * Resultado de um fluxo (e-mail enviado, link inválido, convite aceito...),
 * com o mesmo badge, título e descrição centralizados do `ConfirmDialog`.
 */
export function StatusPanel({
  icon: Icon,
  tone = "info",
  title,
  description,
  children,
  className,
  role = "status",
}: {
  icon: LucideIcon
  tone?: StatusTone
  title: string
  description: React.ReactNode
  /** Ações exibidas abaixo da descrição. */
  children?: React.ReactNode
  className?: string
  role?: "status" | "alert"
}) {
  return (
    <div
      role={role}
      className={cn(
        "flex animate-in flex-col items-center gap-2 py-4 text-center duration-300 fade-in-0 motion-reduce:animate-none",
        className
      )}
    >
      <span
        data-tone={tone}
        className={cn(
          "mb-2 flex size-16 shrink-0 items-center justify-center rounded-2xl border",
          toneClasses[tone]
        )}
      >
        <Icon className="size-8" aria-hidden="true" />
      </span>
      <h2 className="text-lg leading-tight font-semibold text-foreground">
        {title}
      </h2>
      <div className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {description}
      </div>
      {children && (
        <div className="mt-4 flex w-full flex-col-reverse justify-center gap-2 sm:flex-row">
          {children}
        </div>
      )}
    </div>
  )
}
