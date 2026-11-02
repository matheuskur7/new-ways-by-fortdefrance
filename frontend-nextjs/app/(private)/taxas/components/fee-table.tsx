import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import type { FeeBrand } from "../schemas"
import { calculateCardFee } from "../calculator"
import { formatMoney } from "@/lib/masks"

function FeeValue({ value }: { value: number | undefined }) {
  return value === undefined ? (
    <>
      <Skeleton
        aria-hidden="true"
        className="ml-auto h-2.5 w-20 max-w-full animate-none rounded-full bg-muted"
      />
      <span className="sr-only">Aguardando cálculo</span>
    </>
  ) : (
    formatMoney(value)
  )
}

export function FeeTable({
  brand,
  amount,
}: {
  brand: FeeBrand
  amount: number | null
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border">
      <header className="flex flex-col items-center justify-center gap-2 border-b bg-muted/50 px-4 py-1.5 text-center">
        {brand.logo && (
          // SVGs do banco são isolados em uma imagem, sem executar HTML na página.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(brand.logo)}`}
            alt={brand.name}
            className="h-8 w-auto max-w-full object-contain"
          />
        )}
        <h2 className={brand.logo ? "sr-only" : "text-sm font-semibold"}>
          {brand.name}
        </h2>
        <p className="text-xs text-muted-foreground">{brand.channel}</p>
      </header>
      <Table className="table-fixed text-sm">
        <TableCaption className="sr-only">
          Taxas de {brand.name}, {brand.channel}
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="h-8 w-1/4 px-2 pt-0.5 text-center text-[13px]">
              Parcelas
            </TableHead>
            <TableHead className="h-8 w-3/8 px-2 pt-0.5 text-right text-[13px]">
              Parcela
            </TableHead>
            <TableHead className="h-8 w-3/8 px-2 pt-0.5 text-right text-[13px]">
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {brand.rates.map((rate) => {
            const values =
              amount === null
                ? null
                : calculateCardFee(amount, rate.ratePercent, rate.installments)
            return (
              <TableRow key={rate.installments} className="h-11">
                <TableCell className="px-2 py-1 text-center">
                  <span className="block font-medium">
                    {rate.installments}x
                  </span>
                  <span className="block text-[13px] leading-tight text-muted-foreground">
                    {rate.ratePercent.replace(".", ",")}%
                  </span>
                </TableCell>
                <TableCell className="px-2 py-1 text-right">
                  <FeeValue value={values?.installment} />
                </TableCell>
                <TableCell className="px-2 py-1 text-right">
                  <FeeValue value={values?.total} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
