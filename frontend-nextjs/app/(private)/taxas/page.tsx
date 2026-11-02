import { requireSession } from "@/lib/auth-server"
import { requireActiveOrganization } from "@/features/organization/services/require-active-organization"
import { FeeCalculator } from "./_components/fee-calculator"

export default async function FeesPage() {
  const [{ user }, organization] = await Promise.all([
    requireSession(),
    requireActiveOrganization(),
  ])
  return (
    <FeeCalculator
      key={organization.id}
      userId={user.id}
      organizationId={organization.id}
    />
  )
}
