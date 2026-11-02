import { requireActiveOrganization } from "../configuracoes/services/require-active-organization"
import { FeeCalculator } from "./components/fee-calculator"

export default async function FeesPage() {
  await requireActiveOrganization()
  return <FeeCalculator />
}
