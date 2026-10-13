import type { LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Card } from "@/components/ui/card";

type PageHeaderProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  className?: string;
};

export function PageHeader({ icon: Icon, title, subtitle, className }: PageHeaderProps) {
  return (
    <Card className={cn("mx-auto w-full p-6", className)}>
    <header className="flex items-stretch justify-start gap-3 text-left">
      <span className="flex w-14 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground">
        <Icon className="size-8" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </header>
    </Card>
  );
}
