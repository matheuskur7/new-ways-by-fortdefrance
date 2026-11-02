import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1.5 rounded-md border font-medium whitespace-nowrap [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        /** Destaque da marca, para status ou papel de destaque. */
        brand: "border-primary/15 bg-primary/5 text-primary/80",
        /** Informação auxiliar, como contadores e rótulos neutros. */
        neutral: "border-border bg-muted/40 text-muted-foreground",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "sm",
    },
  }
)

/** Rótulo compacto para status, papéis e contadores. Padrão visual único do sistema. */
function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
