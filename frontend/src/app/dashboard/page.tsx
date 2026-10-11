import Link from "next/link";
import { Suspense } from "react";
import { requireOrganization } from "@/lib/auth-server";
import { SignOutButton } from "@/components/auth/sign-out-button";

async function Dashboard() {
  const { user, organization } = await requireOrganization();
  return <section className="mx-auto w-full max-w-4xl p-6 sm:py-16">
    <header className="flex items-center justify-between gap-4"><Link href="/organizations" className="text-sm underline">Trocar organização</Link><SignOutButton /></header>
    <p className="mt-12 text-sm text-zinc-500">Espaço de trabalho</p>
    <h1 className="mt-2 text-3xl font-semibold">{organization.name}</h1>
    <p className="mt-4">Olá, {user.name}. Seu papel nesta organização é <strong>{organization.role}</strong>.</p>
  </section>;
}

export default function Page() {
  return <main><Suspense fallback={<p className="p-6" role="status">Validando seu acesso…</p>}><Dashboard /></Suspense></main>;
}
