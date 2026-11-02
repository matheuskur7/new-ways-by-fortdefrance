import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthRecoverySkeleton } from "@/components/auth/auth-recovery-skeleton";
import { SessionExpiredToast } from "./components/session-expired-toast";
import { organizationIdSchema } from "@/api/organization/schemas";

type Props = { searchParams: Promise<{ invitation?: string | string[] }> };
async function LoginForm({ searchParams }: Props) {
  const result = organizationIdSchema.safeParse(
    (await searchParams).invitation,
  );
  return (
    <AuthForm
      mode="login"
      invitationId={result.success ? result.data : undefined}
    />
  );
}
export default function Page(props: Props) {
  return (
    <AuthShell>
      <SessionExpiredToast />
      <Suspense fallback={<AuthRecoverySkeleton />}>
        <LoginForm {...props} />
      </Suspense>
    </AuthShell>
  );
}
