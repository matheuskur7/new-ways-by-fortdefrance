"use client";

import Link from "next/link";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { useRequestAccountEmail } from "@/api/auth.queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmailRequestForm({
  mode,
  initialEmail = "",
  initiallySent = false,
  onBack,
}: {
  mode: "verification" | "password-reset";
  initialEmail?: string;
  initiallySent?: boolean;
  onBack?: () => void;
}) {
  const mutation = useRequestAccountEmail();
  const [sent, setSent] = useState(initiallySent);
  const [error, setError] = useState("");
  const verification = mode === "verification";

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    setError("");
    try {
      await mutation.mutateAsync({
        mode,
        values: Object.fromEntries(new FormData(event.currentTarget)),
      });
      setSent(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível conectar. Tente novamente.",
      );
    }
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {verification ? "Confirme seu cadastro" : "Recupere seu acesso"}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {verification ? "Confira seu e-mail" : "Esqueceu sua senha?"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {verification
            ? "Confirme seu endereço de e-mail para entrar no sistema."
            : "Informe seu e-mail para solicitar um link de redefinição de senha."}
        </p>
      </header>
      {sent && (
        <Alert>
          <AlertDescription role="status">
            Se houver uma conta elegível para este e-mail, você receberá um link
            válido por 1 hora. Confira também a pasta de spam.
          </AlertDescription>
        </Alert>
      )}
      <form
        onSubmit={submit}
        className="grid gap-4"
        aria-busy={mutation.isPending}
      >
        <div className="grid gap-2">
          <Label htmlFor="recovery-email">E-mail</Label>
          <Input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={initialEmail}
            disabled={mutation.isPending}
            className="h-12"
            placeholder="Seu e-mail"
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={mutation.isPending}
          className="h-12 w-full"
        >
          {mutation.isPending && (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {mutation.isPending
            ? "Solicitando…"
            : sent
              ? "Reenviar e-mail"
              : verification
                ? "Enviar confirmação"
                : "Enviar link de recuperação"}
        </Button>
      </form>
      {onBack ? (
        <Button type="button" variant="link" onClick={onBack}>
          Voltar para entrar
        </Button>
      ) : (
        <Link
          href="/login"
          className="text-center text-sm font-medium text-primary underline underline-offset-4"
        >
          Voltar para entrar
        </Link>
      )}
    </div>
  );
}
