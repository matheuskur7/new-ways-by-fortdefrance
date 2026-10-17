import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAuthContext } from "@/lib/auth-server";
import { organizationIdSchema } from "@/api/organization/schemas";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthRecoverySkeleton } from "@/components/auth/auth-recovery-skeleton";
import { InvitationView } from "./components/invitation-view";
import { SessionMonitor } from "@/components/auth/session-monitor";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ invitationId: string }> };
async function Invitation({ params }: Props) {
  const input = organizationIdSchema.safeParse((await params).invitationId);
  if (!input.success) notFound();
  const context = await getAuthContext();
  if (!context)
    return (
      <div className="grid gap-5">
        <h1 className="text-2xl font-semibold">Convite para uma empresa</h1>
        <p className="text-sm text-muted-foreground">
          Entre com a conta do e-mail que recebeu este convite para visualizar e
          aceitar.
        </p>
        <Button
          render={
            <Link
              href={`/login?invitation=${encodeURIComponent(input.data)}`}
            />
          }
        >
          Entrar para ver o convite
        </Button>
      </div>
    );
  return (
    <>
      <SessionMonitor />
      <InvitationView invitationId={input.data} />
    </>
  );
}
export default function Page(props: Props) {
  return (
    <AuthShell>
      <Suspense fallback={<AuthRecoverySkeleton />}>
        <Invitation {...props} />
      </Suspense>
    </AuthShell>
  );
}
