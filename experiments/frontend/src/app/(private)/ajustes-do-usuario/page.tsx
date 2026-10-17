import { Suspense } from "react";
import { requireSession } from "@/lib/auth-server";
import { UserSettingsForm } from "./components/user-settings-form";
import { UserSettingsSkeleton } from "./components/user-settings-skeleton";

async function AuthenticatedUserSettings() {
  const { user } = await requireSession();
  return <UserSettingsForm user={user} />;
}
export default function Page() {
  return (
    <Suspense fallback={<UserSettingsSkeleton />}>
      <AuthenticatedUserSettings />
    </Suspense>
  );
}
