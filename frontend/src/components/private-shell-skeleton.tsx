import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4 p-6" role="status" aria-label="Carregando conteúdo">
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-5 w-80 max-w-full" />
      <Skeleton className="mt-4 h-40 w-full" />
    </div>
  );
}

export function PrivateShellSkeleton() {
  return (
    <div className="flex min-h-dvh bg-muted/40" role="status" aria-label="Carregando navegação">
      <aside className="hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-3 md:flex">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="mt-3 h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="mt-auto h-12 w-full" />
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex h-12 items-center gap-3 border-b bg-background px-2 sm:px-2.5">
          <Skeleton className="size-8" />
          <Skeleton className="ml-auto h-5 w-40 max-w-full" />
          <Skeleton className="size-10 shrink-0" />
        </div>
        <PageSkeleton />
      </div>
    </div>
  );
}
