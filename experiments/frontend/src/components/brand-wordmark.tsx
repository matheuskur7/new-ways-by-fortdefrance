import { cn } from "cn";

type BrandWordmarkProps = {
  variant?: "default" | "sidebar";
  className?: string;
};

export function BrandWordmark({
  variant = "default",
  className,
}: BrandWordmarkProps) {
  const compact = variant === "sidebar";
  return (
    <div
      style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      className={cn(
        "inline-flex flex-col gap-0 whitespace-nowrap",
        compact &&
          "min-w-0 max-w-48 shrink-0 overflow-hidden opacity-100 transition-[max-width,opacity] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
    >
      <span
        className={cn(
          "font-bold leading-none",
          compact
            ? "text-2xl tracking-tight transition-[font-size] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:text-[0px]"
            : "text-5xl tracking-tighter sm:text-6xl",
        )}
      >
        <span className="text-primary italic">New</span> Ways
      </span>
      <span
        className={cn(
          "leading-none italic",
          compact
            ? "-mt-1 text-xs text-muted-foreground transition-[font-size,margin] duration-200 ease-linear motion-reduce:transition-none group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:text-[0px]"
            : "-mt-1.5 text-sm",
        )}
      >
        by <span className="font-semibold">Fort de France</span>
      </span>
    </div>
  );
}
