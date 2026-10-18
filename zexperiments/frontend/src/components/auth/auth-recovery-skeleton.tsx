import { Skeleton } from "@/components/ui/skeleton";

export function AuthRecoverySkeleton() {
  return (
    <div className="grid gap-6" aria-label="Carregando formulário">
      <Skeleton className="h-9 w-3/4" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
