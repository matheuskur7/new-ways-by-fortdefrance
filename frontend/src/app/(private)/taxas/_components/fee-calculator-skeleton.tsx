import { Skeleton } from "@/components/ui/skeleton";

export function FeeTablesSkeleton() {
  return (
    <div className="mt-3 grid w-full max-w-6xl gap-2 lg:grid-cols-3" role="status" aria-label="Carregando taxas">
      {[0, 1, 2].map((index) => (
        <div key={index} className="overflow-hidden rounded-xl border bg-card p-4">
          <Skeleton className="mx-auto mb-3 h-12 w-40" />
          {Array.from({ length: 12 }, (_, row) => <Skeleton key={row} className="mb-2 h-8 w-full" />)}
        </div>
      ))}
    </div>
  );
}

export function FeeCalculatorSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl" role="status" aria-label="Carregando calculadora">
      <div className="rounded-xl border bg-card p-6"><Skeleton className="h-8 w-80 max-w-full" /><Skeleton className="mt-3 h-5 w-96 max-w-full" /></div>
      <div className="mt-3 rounded-xl border bg-card p-4"><Skeleton className="h-20 w-80 max-w-full" /><FeeTablesSkeleton /></div>
    </div>
  );
}
