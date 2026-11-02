import { ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// TODO: Integrar os contadores de veículos de hoje ao sistema de ordens de serviço (OS) quando implementado.
const indicators = [
  {
    label: "Entradas hoje",
    value: 0,
    icon: ArrowDownLeft,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    label: "Saídas hoje",
    value: 0,
    icon: ArrowUpRight,
    color: "bg-red-50 text-red-700",
  },
]

export function SidebarDailyIndicators() {
  return (
    <section
      aria-label="Indicadores de veículos de hoje"
      className="mb-4 h-18 shrink-0 overflow-hidden px-3 transition-[height,margin] duration-200 ease-in-out group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:h-0 motion-reduce:transition-none"
    >
      <div className="grid w-[calc(var(--sidebar-width)-1.5rem-1px)] origin-top-left scale-100 grid-cols-2 gap-2 p-0.5 opacity-100 transition-[scale,opacity] duration-200 ease-in-out group-data-[collapsible=icon]:scale-0 group-data-[collapsible=icon]:opacity-0 motion-reduce:transition-none">
        {indicators.map(({ label, value, icon: Icon, color }) => (
          <Card
            key={label}
            size="sm"
            className="gap-0 rounded-lg py-2.5 shadow-none ring-0"
          >
            <CardContent className="grid gap-2 px-2.5">
              <p className="text-xs whitespace-nowrap text-muted-foreground">
                {label}
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md ${color}`}
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                </span>
                <p className="text-xl leading-none font-semibold tabular-nums">
                  {value}
                  <span className="sr-only"> veículos</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
