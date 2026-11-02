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
import { useAuthenticate } from "@/api/auth.queries";
import { EmailNotVerifiedError } from "@/api/auth";
import { EmailRequestForm } from "./email-request-form";

export function AuthForm({
  mode,
  invitationId,
}: {
  mode: "login" | "signup";
  invitationId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const authentication = useAuthenticate();
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signup = mode === "signup";
  const [verification, setVerification] = useState<{
    email: string;
    sent: boolean;
  } | null>(null);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    try {
      await authentication.mutateAsync({ mode, values });
      if (signup) {
        setVerification({ email: String(values.email), sent: true });
        return;
      }
      router.replace(
        invitationId
          ? `/invitations/${encodeURIComponent(invitationId)}`
          : "/organizations",
      );
      router.refresh();
    } catch (cause) {
      if (cause instanceof EmailNotVerifiedError) {
        setVerification({ email: String(values.email), sent: false });
        return;
      }
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível conectar. Tente novamente.",
      );
    } finally {
      setPending(false);
    }
  }

  if (verification)
    return (
      <EmailRequestForm
        mode="verification"
        initialEmail={verification.email}
        initiallySent={verification.sent}
        onBack={signup ? undefined : () => setVerification(null)}
      />
    );

  return (
    <div
      className={
        signup
          ? "flex flex-col gap-2"
          : "grid flex-1 grid-rows-[1fr_auto_1fr] gap-6"
      }
    >
      <header className="self-start">
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
      </header>

      <div>
        <form
          onSubmit={submit}
          className={`grid ${signup ? "mt-6 gap-5" : "gap-4"}`}
          aria-busy={pending}
        >
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
          {!signup && (
            <Link
              href="/forgot-password"
              className="justify-self-end text-sm font-medium text-primary underline underline-offset-4"
            >
              Esqueci minha senha
            </Link>
          )}
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
      </div>
      <footer
        className={signup ? "mt-6 flex flex-col gap-2" : "grid self-end gap-3"}
      >
        <p className="text-center text-sm text-muted-foreground">
          {signup ? "Já possui uma conta? " : "Ainda não possui uma conta? "}
          <Link
            replace
            className="font-medium text-primary underline underline-offset-4"
            href={signup ? "/login" : "/signup"}
          >
            {signup ? "Entrar" : "Criar conta"}
          </Link>
        </p>
        <p
          className={`${signup ? "mt-16 " : ""}text-center text-xs text-muted-foreground`}
        >
          Seu acesso é pessoal. Mantenha sua senha em segurança.
        </p>
      </footer>
    </div>
  );
}
