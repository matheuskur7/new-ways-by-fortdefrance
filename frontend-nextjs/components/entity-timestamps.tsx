import { cn } from "cn"

const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" })
const timeFormat = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" })

export function formatTimestamp(value: string | Date) {
  const date = new Date(value)
  return `${dateFormat.format(date)} às ${timeFormat.format(date)}`
}

function Timestamp({ label, value }: { label: string; value: string | Date }) {
  const date = new Date(value)
  return (
    <div className="flex gap-1">
      <dt className="font-semibold">{label}</dt>
      <dd>
        <time dateTime={date.toISOString()}>{formatTimestamp(date)}</time>
      </dd>
    </div>
  )
}

/**
 * Datas de criação e última edição de uma entidade, em texto pequeno e discreto:
 * criação à esquerda e edição à direita. A margem negativa aproxima as datas do
 * conteúdo e do rodapé no grid `gap-6` dos modais.
 */
export function EntityTimestamps({
  createdAt,
  updatedAt,
  className,
}: {
  createdAt: string | Date
  updatedAt: string | Date
  className?: string
}) {
  return (
    <dl
      className={cn(
        "-my-4.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-muted-foreground",
        className
      )}
    >
      <Timestamp label="Criado em" value={createdAt} />
      <Timestamp label="Editado em" value={updatedAt} />
    </dl>
  )
}
