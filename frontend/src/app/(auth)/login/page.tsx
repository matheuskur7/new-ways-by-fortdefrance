import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { SessionExpiredToast } from "@/components/auth/session-expired-toast";

export default function Page() {
  return (
    <AuthShell>
      <SessionExpiredToast />
      <AuthForm mode="login" />
    </AuthShell>
  );
}
