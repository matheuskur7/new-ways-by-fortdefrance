import { Suspense } from "react";
import { requireSession } from "@/lib/auth-server";
import { OrganizationManager } from "./components/organization-manager";
import { SessionMonitor } from "@/components/auth/session-monitor";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { UserAvatar } from "@/components/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

async function Organizations() {
  const context = await requireSession();
  return (
    <div className="flex flex-1 flex-col gap-6">
      <SessionMonitor />
      <header>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Escolha sua empresa
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione seu espaço de trabalho para continuar.
          </p>
        </div>
      </header>
      <div>
        <OrganizationManager activeId={context.organization?.id} />
      </div>
      <footer className="mt-auto pt-2">
        <div className="flex items-center gap-4 rounded-xl border bg-muted/40 p-4">
          <UserAvatar
            image={context.user.image}
            name={context.user.name}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs leading-tight font-medium text-red-600">
              Olá,
            </p>
            <p className="-mt-0.5 wrap-break-word text-lg leading-tight font-semibold tracking-tight">
              {context.user.name}
            </p>
            <p className="mt-1 break-all text-sm text-muted-foreground">
              {context.user.email}
            </p>
          </div>
          <SignOutButton variant="button" />
        </div>
      </footer>
    </div>
  );
}

export default function Page() {
  return (
    <AuthShell>
      <Suspense fallback={<OrganizationsSkeleton />}>
        <Organizations />
      </Suspense>
    </AuthShell>
  );
}

function OrganizationsSkeleton() {
  return (
    <div
      className="flex flex-1 flex-col gap-6"
      role="status"
      aria-label="Carregando empresas"
    >
      <div className="grid self-start gap-6">
        <div className="grid gap-2">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
      <div>
        <div className="grid gap-3 rounded-xl border bg-muted/40 p-6">
          <Skeleton className="mb-2 h-6 w-36" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
      <div className="mt-auto pt-2">
        <div className="flex items-center gap-4 rounded-xl border bg-muted/40 p-4">
          <Skeleton className="size-18 shrink-0 rounded-md" />
          <div className="grid min-w-0 flex-1 gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-36 max-w-full" />
            <Skeleton className="h-4 w-44 max-w-full" />
          </div>
          <Skeleton className="size-8 shrink-0 rounded-md" />
        </div>
      </div>
    </div>
  );
}
