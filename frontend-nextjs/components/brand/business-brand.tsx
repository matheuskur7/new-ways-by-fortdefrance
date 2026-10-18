import { cn } from "cn"

type BrandProps = {
  className?: string
  compact?: boolean
  variant?: "logo" | "text" | "complete"
}

export function BusinessBrand({
  className,
  compact = false,
  variant = "complete",
}: BrandProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {variant != "text" && (
        <img src={"/brand/logo-128.png"} className="w-12" />
      )}
      {variant != "logo" && (
        <img src={"/brand/business-text.svg"} className="w-56" />
      )}
    </div>
  )
}
