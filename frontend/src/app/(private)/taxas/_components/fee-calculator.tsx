"use client";

import { useState, type SubmitEvent } from "react";
import { Calculator } from "lucide-react";
import { useFeeGroups } from "@/api/card-fees/queries";
import type { FeeGroup } from "@/api/card-fees/schemas";
import { calculateCardFee, formatMoney, parseBrazilianAmount, saleAmountSchema } from "@/lib/card-fees/calculator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FeeTablesSkeleton } from "./fee-calculator-skeleton";

function maskBrazilianCurrency(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  if (!value.replace(/\D/g, "")) return "";
  const padded = digits.padStart(3, "0");
  const integer = padded.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${integer},${padded.slice(-2)}`;
}

function FeeTable({ group, amount }: { group: FeeGroup; amount: number | null }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-col items-center justify-center gap-2 border-b bg-muted/50 px-4 py-2! text-center">
        {group.logoSvg && (
          // SVGs dinâmicos do banco são exibidos diretamente, sem otimização do Next.js.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(group.logoSvg)}`} alt={`Logo ${group.name}`} className="h-8 w-auto max-w-full object-contain" />
        )}
        <CardTitle className={group.logoSvg ? "sr-only" : "text-sm font-semibold"}>{group.name}</CardTitle>
        <CardDescription className="text-xs">{group.channel}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="table-fixed text-sm tabular-nums">
          <TableCaption className="sr-only">Taxas de {group.name}, {group.channel}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/4 px-2 text-center text-[13px]">Parcelas</TableHead>
              <TableHead className="w-3/8 px-2 text-right text-[13px]">Parcela</TableHead>
              <TableHead className="w-3/8 px-2 text-right text-[13px]">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.rates.map((rate) => {
              const values = amount === null ? null : calculateCardFee(amount, rate.ratePercent, rate.installments);
              return (
                <TableRow key={rate.installments} className="h-11 odd:bg-muted/25 even:bg-background hover:bg-muted/35">
                  <TableCell className="px-2 py-1 text-center">
                    <span className="block font-medium">{rate.installments}x</span>
                    <span className="block text-[13px] leading-tight text-muted-foreground">{rate.ratePercent.replace(".", ",")}%</span>
                  </TableCell>
                  <TableCell className="px-2 py-1 text-right">
                    {values ? formatMoney(values.installment) : <><Skeleton aria-hidden="true" className="ml-auto h-2.5 w-20 max-w-full animate-none rounded-full bg-muted" /><span className="sr-only">Aguardando cálculo</span></>}
                  </TableCell>
                  <TableCell className="px-2 py-1 text-right">
                    {values ? formatMoney(values.total) : <><Skeleton aria-hidden="true" className="ml-auto h-2.5 w-20 max-w-full animate-none rounded-full bg-muted" /><span className="sr-only">Aguardando cálculo</span></>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function FeeCalculator() {
  const query = useFeeGroups();
  const [input, setInput] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState("");

  function calculate(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = saleAmountSchema.safeParse(parseBrazilianAmount(input));
    if (!result.success) {
      setError("Informe um valor válido maior que zero, como 1.000,00 (máximo R$ 1 bilhão).");
      setAmount(null);
      return;
    }
    setError("");
    setAmount(result.data);
  }

  return (
    <section className="w-full">
      <header className="mb-6 flex items-stretch justify-start gap-3 text-left">
        <span className="flex w-14 shrink-0 items-center justify-center rounded-xl border bg-background text-foreground"><Calculator className="size-8" aria-hidden="true" /></span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calculadora de Taxas de Cartão</h1>
          <p className="mt-1 text-sm text-muted-foreground">Informe o valor da venda para calcular as opções de parcelamento.</p>
        </div>
      </header>
      <div className="w-fit max-w-full text-left">
          <form onSubmit={calculate} className="flex flex-col items-start justify-start gap-3 sm:flex-row sm:items-end">
            <div className="grid w-40 max-w-full gap-2">
              <Label htmlFor="sale-amount" className="justify-start">Valor da venda (R$)</Label>
              <Input id="sale-amount" className="h-10 bg-white text-left text-lg" inputMode="numeric" autoComplete="off" placeholder="0,00" value={input} aria-invalid={!!error} aria-describedby={error ? "amount-error" : undefined} onChange={(event) => setInput(maskBrazilianCurrency(event.target.value))} />
            </div>
            <Button type="submit" size="lg" className="sm:min-w-40" disabled={query.isError || !query.data?.length}>Calcular</Button>
          </form>
      </div>
      {error && <p id="amount-error" role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {query.isPending && <FeeTablesSkeleton />}
      {query.isError && <Alert variant="destructive" className="mt-6"><AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>{query.error.message}</span><Button type="button" variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>Tentar novamente</Button></AlertDescription></Alert>}
      {!query.isError && query.data?.length === 0 && <p role="status" className="mt-6 text-center text-sm text-muted-foreground">Nenhum grupo de taxas cadastrado.</p>}
      {!query.isError && query.data && <div className="mt-6 grid w-full max-w-6xl gap-4 lg:grid-cols-3">{query.data.map((group) => <FeeTable key={group.id} group={group} amount={amount} />)}</div>}
    </section>
  );
}
