import { requireActiveOrganization } from "@/features/organization/services/require-active-organization"
import { FeeCalculator } from "./_components/fee-calculator"

export default async function FeesPage() {
  await requireActiveOrganization()
  return <FeeCalculator />
}
