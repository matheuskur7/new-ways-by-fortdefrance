import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function Page() {
  return (
    <AuthShell>
      <AuthForm mode="login" />
    </AuthShell>
  );
}
