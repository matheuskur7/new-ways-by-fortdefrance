"use client"
import type { ReactNode } from "react"
import { CreditCard, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import type { ManagedGroup } from "../management-schemas"

export function FeeGroupCard({
  group,
  canEdit,
  onEdit,
  dragHandle,
}: {
  group: ManagedGroup
  canEdit: boolean
  onEdit: () => void
  dragHandle?: ReactNode
}) {
  return (
    <Card size="sm" className="min-w-0 gap-0 overflow-hidden py-0">
      <CardContent className="grid gap-0 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/15 p-4">
          <div className="flex min-w-0 items-center gap-2">
            {dragHandle}
            <div className="min-w-0">
              <h3 className="flex items-start gap-2 font-semibold wrap-break-word">
                <CreditCard
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                {group.name}
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {group.channel} · {group.rates.length} opções de parcelamento
              </p>
            </div>
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil /> Editar grupo
            </Button>
          )}
        </div>
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="h-9 pl-4 text-xs">Parcelas</TableHead>
              <TableHead className="h-9 pr-4 text-right text-xs">
                Taxa
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...group.rates]
              .sort((a, b) => a.installments - b.installments)
              .map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="pl-4 font-medium">
                    {rate.installments}x
                  </TableCell>
                  <TableCell className="pr-4 text-right tabular-nums">
                    {rate.ratePercent.replace(".", ",")}%
                  </TableCell>
                </TableRow>
              ))}
            {!group.rates.length && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="py-6 text-center text-muted-foreground"
                >
                  Nenhuma taxa cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
