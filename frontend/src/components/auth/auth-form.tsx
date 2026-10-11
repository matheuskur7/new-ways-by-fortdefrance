"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { signInSchema, signUpSchema } from "@/lib/auth-schemas";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const signup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    try {
      if (signup) {
        const input = signUpSchema.safeParse(values);
        if (!input.success) { setError(input.error.issues[0].message); return; }
        const result = await authClient.signUp.email(input.data);
        if (result.error) { setError(result.error.message ?? "Não foi possível criar sua conta."); return; }
      } else {
        const input = signInSchema.safeParse(values);
        if (!input.success) { setError(input.error.issues[0].message); return; }
        const result = await authClient.signIn.email(input.data);
        if (result.error) { setError(result.error.message ?? "Email ou senha inválidos."); return; }
      }
      router.replace("/organizations");
      router.refresh();
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally { setPending(false); }
  }

  return (
    <section className="auth-card">
      <Link href="/" className="text-sm font-semibold">New Ways</Link>
      <h1 className="mt-6 text-3xl font-semibold">{signup ? "Crie sua conta" : "Entre na sua conta"}</h1>
      <p className="mt-2 text-sm text-zinc-500">Acesse suas organizações e seu espaço de trabalho.</p>
      <form onSubmit={submit} className="mt-6 grid gap-4">
        {signup && <label className="grid gap-2">Nome<input className="form-control" name="name" autoComplete="name" required maxLength={200} /></label>}
        <label className="grid gap-2">Email<input className="form-control" name="email" type="email" autoComplete="email" required /></label>
        <label className="grid gap-2">Senha<input className="form-control" name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} required minLength={signup ? 8 : 1} maxLength={128} /></label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button className="primary-button" disabled={pending} type="submit">{pending ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}</button>
      </form>
      <p className="mt-6 text-sm">{signup ? "Já possui uma conta? " : "Ainda não possui uma conta? "}<Link className="underline" href={signup ? "/login" : "/signup"}>{signup ? "Entrar" : "Criar conta"}</Link></p>
    </section>
  );
}
