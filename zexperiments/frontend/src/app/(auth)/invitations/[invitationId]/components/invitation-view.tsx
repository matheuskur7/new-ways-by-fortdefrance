"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAcceptInvitation, useInvitation } from "@/api/organization/queries";
import { organizationRoleLabel } from "@/api/organization/schemas";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthRecoverySkeleton } from "@/components/auth/auth-recovery-skeleton";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function InvitationView({ invitationId }: { invitationId: string }) {
  const query = useInvitation(invitationId);
  const acceptance = useAcceptInvitation();
  const router = useRouter();
  const [error, setError] = useState("");
  async function accept() {
    if (acceptance.isPending) return;
    setError("");
    try {
      await acceptance.mutateAsync(invitationId);
      router.replace("/organizations");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível aceitar o convite.",
      );
    }
  }
  if (query.isPending) return <AuthRecoverySkeleton />;
  if (query.error || !query.data)
    return (
      <div className="grid gap-5">
        <h1 className="text-2xl font-semibold">Convite indisponível</h1>
        <p className="text-sm text-muted-foreground">
          O convite pode ter expirado, sido cancelado ou pertencer a outra
          conta. Entre com a conta do e-mail convidado, já confirmado.
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/organizations" />}
        >
          Minhas empresas
        </Button>
        <SignOutButton variant="button" />
      </div>
    );
  return (
    <div className="grid gap-5">
      <h1 className="text-2xl font-semibold">
        Convite para {query.data.organizationName}
      </h1>
      <p className="text-sm text-muted-foreground">
        Você foi convidado como{" "}
        {organizationRoleLabel(query.data.role).toLowerCase()}. Aceite para
        participar desta empresa.
      </p>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button disabled={acceptance.isPending} onClick={() => void accept()}>
        {acceptance.isPending ? "Aceitando…" : "Aceitar convite"}
      </Button>
      <Button
        variant="outline"
        nativeButton={false}
        render={<Link href="/organizations" />}
      >
        Voltar para minhas empresas
      </Button>
    </div>
  );
}
