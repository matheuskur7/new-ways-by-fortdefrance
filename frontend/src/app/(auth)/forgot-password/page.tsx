import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailRequestForm } from "@/components/auth/email-request-form";

export const metadata: Metadata = {
  title: "Recuperar senha — New Ways",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthShell>
      <EmailRequestForm mode="password-reset" />
    </AuthShell>
  );
}
