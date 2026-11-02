import type * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "cn"

/**
 * Card de seção com ícone, título, descrição e ações opcionais no canto superior direito.
 * Padrão visual dos cards de conteúdo das páginas e das seções dos modais.
 */
function SectionCard({
  icon: Icon,
  title,
  description,
  action,
  headingLevel = "h2",
  className,
  children,
  ...props
}: React.ComponentProps<"section"> & {
  icon?: LucideIcon
  title: string
  description?: string
  /** Ações exibidas à direita do título, como um botão de adicionar. */
  action?: React.ReactNode
  headingLevel?: "h2" | "h3"
}) {
  const Heading = headingLevel

  return (
    <section
      data-slot="section-card"
      className={cn(
        "grid min-w-0 content-start gap-4 rounded-lg border bg-card p-4",
        className
      )}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Heading className="flex items-center gap-2 text-sm font-semibold">
            {Icon && (
              <Icon
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
            )}
            {title}
          </Heading>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export { SectionCard }
