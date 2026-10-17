import { Suspense, type ReactNode } from "react";
import { requireSession } from "@/lib/auth-server";
import { PrivateShell } from "@/components/private-shell";
import { PrivateShellSkeleton } from "@/components/private-shell-skeleton";

async function AuthenticatedShell({ children }: { children: ReactNode }) {
  const context = await requireSession();
  return <PrivateShell context={context}>{children}</PrivateShell>;
}

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PrivateShellSkeleton />}>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </Suspense>
  );
}
