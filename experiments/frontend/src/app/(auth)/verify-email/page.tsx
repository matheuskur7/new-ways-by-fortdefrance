import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthRecoverySkeleton } from "@/components/auth/auth-recovery-skeleton";
import { VerificationResult } from "./components/verification-result";

export const metadata: Metadata = {
  title: "Confirmar e-mail — New Ways",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthRecoverySkeleton />}>
        <VerificationResult />
      </Suspense>
    </AuthShell>
  );
}
