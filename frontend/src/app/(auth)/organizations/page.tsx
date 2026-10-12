import { Suspense } from "react";
import { requireSession } from "@/lib/auth-server";
import { OrganizationManager } from "@/components/auth/organization-manager";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";

async function Organizations() {
  const context = await requireSession();
  return (
    <div>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Olá, {context.user.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Escolha sua empresa
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Selecione seu espaço de trabalho para continuar.
          </p>
        </div>
        <SignOutButton variant="button" />
      </header>
      <OrganizationManager activeId={context.organization?.id} />
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
    <div className="grid gap-4" role="status" aria-label="Carregando empresas">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-9 w-64 max-w-full" />
      <Skeleton className="h-10 w-full" />
      <div className="mt-4 grid gap-3 rounded-xl border p-6">
        <Skeleton className="mb-2 h-6 w-36" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
