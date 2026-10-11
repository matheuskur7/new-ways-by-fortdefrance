"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { signInSchema, signUpSchema } from "@/lib/auth-schemas";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signup = mode === "signup";

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    try {
      if (signup) {
        const input = signUpSchema.safeParse(values);
        if (!input.success) {
          setError(input.error.issues[0].message);
          return;
        }
        const result = await authClient.signUp.email(input.data);
        if (result.error) {
          setError(result.error.message ?? "Não foi possível criar sua conta.");
          return;
        }
      } else {
        const input = signInSchema.safeParse(values);
        if (!input.success) {
          setError(input.error.issues[0].message);
          return;
        }
        const result = await authClient.signIn.email(input.data);
        if (result.error) {
          setError(result.error.message ?? "Email ou senha inválidos.");
          return;
        }
      }
      let destination = "/organizations";
      if (!signup) {
        // Only a fresh login may skip company selection.
        try {
          const companies = await authClient.organization.list();
          if (!companies.error && companies.data?.length === 1) {
            const activation = await authClient.organization.setActive({
              organizationId: companies.data[0].id,
            });
            if (!activation.error) destination = "/dashboard";
          }
        } catch {
          // Keep the authenticated session and allow manual selection on failure.
        }
        router.push(destination);
      } else {
        router.replace(destination);
      }
      router.refresh();
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {signup ? "Comece por aqui" : "Bem-vindo de volta"}
        </p>
        <h1 className="mt-0 text-3xl font-semibold tracking-tight">
          {signup ? "Crie sua conta" : "Entre na sua conta"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {signup
            ? "Crie sua conta para acessar suas empresas e seu espaço de trabalho."
            : "Use seu e-mail e sua senha para acessar o sistema."}
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-5" aria-busy={pending}>
        {signup && (
          <div className="grid gap-2">
            <Label htmlFor="auth-name">Nome</Label>
            <Input
              id="auth-name"
              className="h-12"
              placeholder="Seu nome completo"
              disabled={pending}
              name="name"
              autoComplete="name"
              required
              maxLength={200}
            />
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            className="h-12"
            placeholder="Seu e-mail"
            disabled={pending}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="auth-password">Senha</Label>
          <div className="relative">
            <Input
              id="auth-password"
              className="h-12 pr-12"
              placeholder="Digite sua senha"
              disabled={pending}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={signup ? "new-password" : "current-password"}
              required
              minLength={signup ? 8 : 1}
              maxLength={128}
            />
            <IconButton
              type="button"
              variant="ghost"
              disabled={pending}
              className="absolute top-2 right-2"
              label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-controls="auth-password"
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeOff aria-hidden="true" />
              ) : (
                <Eye aria-hidden="true" />
              )}
            </IconButton>
          </div>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          size="lg"
          className="h-12 w-full"
          disabled={pending}
          type="submit"
        >
          {pending && (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {pending
            ? signup
              ? "Criando conta…"
              : "Entrando…"
            : signup
              ? "Criar conta"
              : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {signup ? "Já possui uma conta? " : "Ainda não possui uma conta? "}
        <Link
          replace
          className="font-medium text-primary underline underline-offset-4"
          href={signup ? "/login" : "/signup"}
        >
          {signup ? "Entrar" : "Criar conta"}
        </Link>
      </p>
      <p className="mt-16 text-center text-xs text-muted-foreground">
        Seu acesso é pessoal. Mantenha sua senha em segurança.
      </p>
    </div>
  );
}
