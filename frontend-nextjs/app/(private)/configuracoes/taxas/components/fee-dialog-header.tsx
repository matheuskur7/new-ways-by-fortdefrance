import type { LucideIcon } from "lucide-react"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export function FeeDialogHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <DialogHeader className="flex-row items-center gap-3 pr-8">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-muted/40 text-primary">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="grid min-w-0 gap-1.5">
        <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </div>
    </DialogHeader>
  )
}
