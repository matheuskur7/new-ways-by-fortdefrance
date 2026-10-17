import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export function UserSettingsSkeleton() {
  return (
    <div
      className="mx-auto grid w-full max-w-6xl gap-3"
      role="status"
      aria-label="Carregando ajustes do usuário"
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
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
