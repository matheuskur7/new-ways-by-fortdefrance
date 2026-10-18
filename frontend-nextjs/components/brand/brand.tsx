import { cn } from "cn"

type BrandProps = {
  variant?: "default" | "sidebar"
  className?: string
}

export function Brand({ variant = "default", className }: BrandProps) {
  return (
    <div
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      className={cn(
        "inline-flex flex-col gap-0 whitespace-nowrap",
        variant == "sidebar" &&
          "max-w-48 min-w-0 shrink-0 overflow-hidden opacity-100 transition-[max-width,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none",
        className
      )}
    >
      <span
        className={cn(
          "leading-none font-bold",
          variant == "sidebar"
            ? "text-2xl tracking-tight transition-[font-size] duration-200 ease-in-out group-data-[collapsible=icon]:text-[0px] motion-reduce:transition-none"
            : "text-5xl tracking-tighter sm:text-6xl"
        )}
      >
        <span className="text-primary italic">New</span> Ways
      </span>
      <span
        className={cn(
          "leading-none italic",
          variant == "sidebar"
            ? "-mt-1 text-xs text-muted-foreground transition-[font-size,margin] duration-200 ease-in-out group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:text-[0px] motion-reduce:transition-none"
            : "-mt-1.5 text-sm"
        )}
      >
        by <span className="font-semibold">Fort de France</span>
      </span>
    </div>
  )
}
