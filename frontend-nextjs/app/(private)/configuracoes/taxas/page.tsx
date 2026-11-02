import { requireSession } from "@/lib/auth-server"
import { canManageOrganization } from "@/features/organization/schemas"
import { requireActiveOrganization } from "@/features/organization/services/require-active-organization"
import { FeeSettings } from "./_components/fee-settings"

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
      className="flex flex-1 flex-col gap-3"
    >
      <FeeSettings
        key={organization.id}
        userId={user.id}
        organizationId={organization.id}
        canEdit={canManageOrganization(organization.role)}
      />
    </div>
  )
}
