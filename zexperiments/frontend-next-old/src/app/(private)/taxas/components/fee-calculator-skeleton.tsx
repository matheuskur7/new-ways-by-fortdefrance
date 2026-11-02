import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function FeeTablesSkeleton() {
  return (
    <div
      className="mt-3 grid w-full max-w-6xl gap-2 lg:grid-cols-3"
      role="status"
      aria-label="Carregando taxas"
    >
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border bg-card p-4"
        >
          <Skeleton className="mx-auto mb-3 h-12 w-40" />
          {Array.from({ length: 12 }, (_, row) => (
            <Skeleton key={row} className="mb-2 h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function FeeCalculatorSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl"
      role="status"
      aria-label="Carregando calculadora"
    >
      <div className="pb-2">
        <div className="flex items-stretch gap-3 px-1 py-3">
          <Skeleton className="w-14 shrink-0 rounded-xl" />
          <div className="grid flex-1 gap-2">
            <Skeleton className="h-8 w-80 max-w-full" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
        </div>
        <Separator className="mt-3" />
      </div>
      <div className="mt-3 rounded-xl border bg-card p-4">
        <Skeleton className="h-20 w-80 max-w-full" />
        <FeeTablesSkeleton />
      </div>
    </div>
  );
}
