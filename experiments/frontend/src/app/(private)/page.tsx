import { Suspense } from "react";
import { requireOrganization } from "@/lib/auth-server";
import { PageSkeleton } from "@/components/private-shell-skeleton";

async function Dashboard() {
  const { user, organization } = await requireOrganization();
  return (
    <section className="mx-auto w-full max-w-4xl p-6 sm:py-16">
      <p className="text-sm text-muted-foreground">Espaço de trabalho</p>
      <h1 className="mt-2 text-3xl font-semibold">{organization.name}</h1>
      <p className="mt-4">
        Olá, {user.name}. Seu papel nesta empresa é{" "}
        <strong>{organization.role}</strong>.
      </p>
    </section>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
