import { Suspense } from "react";
import { requireSession } from "@/lib/auth-server";
import { OrganizationManager } from "@/components/auth/organization-manager";
import { SignOutButton } from "@/components/auth/sign-out-button";

async function Organizations() {
  const context = await requireSession();
  return <section className="mx-auto w-full max-w-4xl p-6 sm:py-16">
    <header className="flex items-start justify-between gap-4"><div><p className="text-sm text-zinc-500">Olá, {context.user.name}</p><h1 className="mt-2 text-3xl font-semibold">Escolha sua organização</h1></div><SignOutButton /></header>
    <OrganizationManager activeId={context.organization?.id} />
  </section>;
}

export default function Page() {
  return <main><Suspense fallback={<p className="p-6" role="status">Validando sua sessão…</p>}><Organizations /></Suspense></main>;
}
