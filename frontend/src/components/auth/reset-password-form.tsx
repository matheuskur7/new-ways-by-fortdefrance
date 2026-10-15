"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { SubmitEvent } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useResetPassword } from "@/api/auth.queries";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const mutation = useResetPassword();
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mutation.isPending) return;
    setError("");
    try {
      await mutation.mutateAsync({
        ...Object.fromEntries(new FormData(event.currentTarget)),
        token,
      });
      setComplete(true);
      // Remove the consumed secret from the current history entry.
      window.history.replaceState(null, "", "/reset-password");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível conectar. Tente novamente.",
      );
    }
  }

  if (complete)
    return (
      <div className="grid gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Senha redefinida
        </h1>
        <p className="text-sm text-muted-foreground" role="status">
          Sua senha foi alterada e as sessões anteriores foram encerradas. Entre
          novamente para continuar.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Entrar com a nova senha
        </Link>
      </div>
    );

  if (!token || token.length > 2048 || params.has("error"))
    return (
      <div className="grid gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Link inválido ou expirado
        </h1>
        <p className="text-sm text-muted-foreground">
          Solicite um novo link para redefinir sua senha.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Solicitar novo link
        </Link>
      </div>
    );

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          Crie uma nova senha
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Use de 8 a 128 caracteres.
        </p>
      </header>
      <form
        onSubmit={submit}
        className="grid gap-4"
        aria-busy={mutation.isPending}
      >
        <div className="grid gap-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <div className="relative">
            <Input
              id="new-password"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={mutation.isPending}
              className="h-12 pr-12"
            />
            <IconButton
              type="button"
              variant="ghost"
              className="absolute top-2 right-2"
              label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-controls="new-password confirm-password"
              aria-pressed={showPassword}
              disabled={mutation.isPending}
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
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirme a nova senha</Label>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
            disabled={mutation.isPending}
            className="h-12"
          />
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {error && (
          <Link
            href="/forgot-password"
            className="text-sm text-primary underline underline-offset-4"
          >
            Solicitar novo link
          </Link>
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
          {mutation.isPending ? "Salvando…" : "Redefinir senha"}
        </Button>
      </form>
      <Link
        href="/login"
        className="text-center text-sm font-medium text-primary underline underline-offset-4"
      >
        Voltar para entrar
      </Link>
    </div>
  );
}
