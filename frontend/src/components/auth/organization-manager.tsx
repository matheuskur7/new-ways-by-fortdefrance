"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { organizationSchema } from "@/lib/auth-schemas";

export function OrganizationManager({ activeId }: { activeId?: string }) {
  const router = useRouter();
  const { data: organizations, isPending: loading, error: listError } = authClient.useListOrganizations();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function activate(organizationId: string) {
    const result = await authClient.organization.setActive({ organizationId });
    if (result.error) throw new Error(result.error.message ?? "Não foi possível selecionar a organização.");
    router.replace("/dashboard");
    router.refresh();
  }

  async function select(organizationId: string) {
    setPending(true); setError("");
    try { await activate(organizationId); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível selecionar a organização."); }
    finally { setPending(false); }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const input = organizationSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!input.success) { setError(input.error.issues[0].message); return; }
    setPending(true); setError("");
    try {
      const { data, error } = await authClient.organization.create(input.data);
      if (error || !data) throw new Error(error?.message ?? "Não foi possível criar a organização.");
      form.reset();
      await activate(data.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível criar a organização."); }
    finally { setPending(false); }
  }

  return <div className="mt-8 grid gap-8 sm:grid-cols-2">
    <section>
      <h2 className="text-xl font-semibold">Suas organizações</h2>
      {loading && <p className="mt-4" role="status">Carregando…</p>}
      {listError && <p className="mt-4 text-red-600" role="alert">Não foi possível carregar as organizações.</p>}
      {!loading && !listError && !organizations?.length && <p className="mt-4 text-zinc-500">Crie sua primeira organização para continuar.</p>}
      <ul className="mt-4 grid gap-3">{organizations?.map(org => <li key={org.id}><button disabled={pending} onClick={() => select(org.id)} className="w-full rounded-lg border border-zinc-300 p-4 text-left hover:bg-zinc-100 disabled:opacity-50"><span className="font-medium">{org.name}</span><span className="mt-1 block text-sm text-zinc-500">{org.id === activeId ? "Organização ativa" : org.slug}</span></button></li>)}</ul>
    </section>
    <section>
      <h2 className="text-xl font-semibold">Nova organização</h2>
      <form onSubmit={create} className="mt-4 grid gap-4">
        <label className="grid gap-2">Nome<input className="form-control" name="name" required maxLength={200} /></label>
        <label className="grid gap-2">Identificador<input className="form-control" name="slug" placeholder="minha-empresa" required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
        <button className="primary-button" disabled={pending} type="submit">{pending ? "Aguarde…" : "Criar organização"}</button>
      </form>
    </section>
    {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
  </div>;
}
