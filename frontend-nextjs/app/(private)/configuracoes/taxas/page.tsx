import { Percent } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function FeeSettingsPage() {
  return (
    <div
      id="settings-fees-panel"
      role="tabpanel"
      aria-labelledby="settings-fees-tab"
      className="flex flex-col gap-3"
    >
      <PageHeader
        icon={Percent}
        title="Configurações de Taxas"
        subtitle="Gerencie as taxas e as opções de pagamento."
      />
      <Card className="ring-0">
        <CardHeader>
          <CardTitle>Configurações de taxas</CardTitle>
        </CardHeader>
        <CardContent className="min-h-24" />
      </Card>
    </div>
  )
}
