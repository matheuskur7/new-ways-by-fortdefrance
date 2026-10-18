"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmailRequestForm } from "@/components/auth/email-request-form";

export function VerificationResult() {
  const params = useSearchParams();
  if (!params.has("error") && params.get("verified") === "1") {
    return (
      <div className="grid gap-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          E-mail confirmado
        </h1>
        <p className="text-sm text-muted-foreground">
          Seu e-mail foi confirmado. Entre com seu e-mail e senha para
          continuar.
        </p>
        <Link
          href="/login"
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Entrar na minha conta
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-5">
      {params.has("error") && (
        <Alert variant="destructive">
          <AlertDescription>
            O link de confirmação está inválido ou expirou. Solicite um novo
            e-mail abaixo.
          </AlertDescription>
        </Alert>
      )}
      <EmailRequestForm mode="verification" />
    </div>
  );
}
