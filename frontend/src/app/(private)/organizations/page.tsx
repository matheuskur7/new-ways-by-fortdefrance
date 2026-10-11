import { Suspense } from "react";
import { requireSession } from "@/lib/auth-server";
import { OrganizationManager } from "@/components/auth/organization-manager";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AuthShell } from "@/components/auth/auth-shell";

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
        <SignOutButton />
      </header>
      <OrganizationManager activeId={context.organization?.id} />
    </div>
  );
}

export default function Page() {
  return (
    <AuthShell>
      <Suspense fallback={<p role="status">Validando sua sessão…</p>}>
        <Organizations />
      </Suspense>
    </AuthShell>
  );
}
