import { Skeleton } from "@/components/ui/skeleton";

export function UserSettingsSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-3" role="status" aria-label="Carregando ajustes do usuário">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
