import { Suspense } from "react";
import { requireOrganization } from "@/lib/auth-server";
import { FeeCalculator } from "./_components/fee-calculator";
import { FeeCalculatorSkeleton } from "./_components/fee-calculator-skeleton";

async function ProtectedFees() {
  await requireOrganization();
  return <FeeCalculator />;
}

export default function FeesPage() {
  return <Suspense fallback={<FeeCalculatorSkeleton />}><ProtectedFees /></Suspense>;
}
