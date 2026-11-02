import { Suspense } from "react";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth-server";
import { organizationIdSchema } from "@/api/organization/schemas";
import { fetchOrganizationSettings } from "@/api/organization/settings.server";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthRecoverySkeleton } from "@/components/auth/auth-recovery-skeleton";
import { OrganizationSettings } from "./components/organization-settings";

type Props = { params: Promise<{ organizationId: string }> };
async function Settings({ params }: Props) {
  await requireSession();
  const input = organizationIdSchema.safeParse((await params).organizationId);
  if (!input.success) notFound();
  const data = await fetchOrganizationSettings(input.data);
  return (
    <OrganizationSettings organizationId={input.data} initialData={data} />
  );
}
export default function Page(props: Props) {
  return (
    <AuthShell wide>
      <Suspense fallback={<AuthRecoverySkeleton />}>
        <Settings {...props} />
      </Suspense>
    </AuthShell>
  );
}
