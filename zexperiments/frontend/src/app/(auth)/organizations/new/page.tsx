import { Suspense } from "react";
import { requireSession } from "@/lib/auth-server";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthRecoverySkeleton } from "@/components/auth/auth-recovery-skeleton";
import { NewOrganizationForm } from "./components/new-organization-form";

async function NewOrganization() {
  await requireSession();
  return <NewOrganizationForm />;
}
export default function Page() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthRecoverySkeleton />}>
        <NewOrganization />
      </Suspense>
    </AuthShell>
  );
}
