import type { LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Separator } from "@/components/ui/separator";

type PageHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  className?: string;
};

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mx-auto w-full pb-2", className)}>
      <header className="flex items-stretch justify-start gap-3 px-1 py-3 text-left">
        <span className="flex w-14 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground">
          <Icon className="size-8" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      <Separator className="mt-3" />
    </div>
  );
}
