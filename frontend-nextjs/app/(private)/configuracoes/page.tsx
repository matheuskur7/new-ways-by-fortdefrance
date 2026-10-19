import { Settings } from "lucide-react"
import { PageHeader } from "@/components/page-header"

export default function GeneralSettingsPage() {
  return (
    <div
      id="settings-general-panel"
      role="tabpanel"
      aria-labelledby="settings-general-tab"
    >
      <PageHeader
        icon={Settings}
        title="Configurações do Sistema"
        subtitle="Gerencie as configurações gerais do sistema."
      />
    </div>
  )
}
