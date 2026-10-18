import { requireSession } from "@/lib/auth-server"
import { FeeCalculator } from "./components/fee-calculator"

export default async function FeesPage() {
  await requireSession()
  return <FeeCalculator />
}
