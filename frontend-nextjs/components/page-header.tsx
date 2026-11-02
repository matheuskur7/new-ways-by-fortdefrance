import type { LucideIcon } from "lucide-react"
import { cn } from "cn"
import { Separator } from "@/components/ui/separator"

type PageHeaderProps = {
  icon: LucideIcon
  title: string
  subtitle: string
  className?: string
}

/** Badge quadrado com o ícone da página, compartilhado pelos cabeçalhos. */
export function PageHeaderIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground",
        className
      )}
    >
      <Icon className="size-8" aria-hidden="true" />
    </span>
  )
}

export function PageHeader({
  icon,
  title,
  subtitle,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mx-auto w-full pb-1.5", className)}>
      <header className="flex items-center justify-start gap-3 px-1 py-2.5 text-left">
        <PageHeaderIcon icon={icon} />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      <Separator className="mt-2" />
    </div>
  )
}
