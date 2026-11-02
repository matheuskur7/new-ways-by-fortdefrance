import { requireSession } from "@/lib/auth-server"
import { canManageOrganization } from "@/app/(auth)/empresas/schemas"
import { requireActiveOrganization } from "../services/require-active-organization"
import { FeeManagement } from "./components/fee-management"

export default async function FeeSettingsPage() {
  const [{ user }, organization] = await Promise.all([
    requireSession(),
    requireActiveOrganization(),
  ])
  return (
    <div
      id="settings-fees-panel"
      role="tabpanel"
      aria-labelledby="settings-fees-tab"
      className="flex flex-col gap-3"
    >
      <FeeManagement
        key={organization.id}
        userId={user.id}
        organizationId={organization.id}
        canEdit={canManageOrganization(organization.role)}
      />
    </div>
  )
}
