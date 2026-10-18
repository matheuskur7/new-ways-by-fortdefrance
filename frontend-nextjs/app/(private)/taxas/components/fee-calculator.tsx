"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { Calculator } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { saleAmountFormSchema } from "../schemas"
import { useCardFees } from "../hooks/use-card-fees"
import { maskCurrency, parseBrazilianAmount } from "@/lib/masks"
import { FeeTable } from "./fee-table"

export function FeeCalculator() {
  const [amount, setAmount] = useState<number | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof saleAmountFormSchema>>({
    resolver: zodResolver(saleAmountFormSchema),
    defaultValues: { amount: "" },
  })
  const amountField = register("amount")
  const query = useCardFees()
  return (
    <section className="mx-auto w-full max-w-6xl">
      <PageHeader
        icon={Calculator}
        title="Calculadora de Taxas de Cartão"
        subtitle="Informe o valor da venda para calcular as opções de parcelamento."
        className="mb-3"
      />
      <Card className="ring-0">
        <CardContent>
          <form
            onSubmit={handleSubmit((values) =>
              setAmount(parseBrazilianAmount(values.amount))
            )}
            className="flex flex-col items-start gap-1.5"
          >
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
              <div className="grid w-40 max-w-full gap-2">
                <Label htmlFor="sale-amount">Valor da venda (R$)</Label>
                <Input
                  id="sale-amount"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0,00"
                  className="h-10 bg-background text-lg"
                  aria-invalid={!!errors.amount}
                  aria-describedby={errors.amount ? "amount-error" : undefined}
                  {...amountField}
                  onChange={(event) => {
                    event.target.value = maskCurrency(event.target.value)
                    void amountField.onChange(event)
                  }}
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="sm:min-w-40"
                disabled={!query.data?.length || query.isError}
              >
                Calcular
              </Button>
            </div>
            {errors.amount && (
              <p
                id="amount-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.amount.message}
              </p>
            )}
          </form>
          {query.isPending && (
            <div
              role="status"
              aria-label="Carregando taxas"
              className="mt-3 grid gap-2 lg:grid-cols-3"
            >
              {[0, 1, 2].map((key) => (
                <Skeleton key={key} className="h-128 w-full" />
              ))}
            </div>
          )}
          {query.isError && (
            <div
              role="alert"
              className="mt-3 flex flex-wrap items-center gap-3 text-sm text-destructive"
            >
              Não foi possível carregar as taxas.
              <Button
                variant="outline"
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                Tentar novamente
              </Button>
            </div>
          )}
          {query.data?.length === 0 && (
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              Nenhum grupo de taxas cadastrado.
            </p>
          )}
          {!query.isError && (
            <div className="mt-3 grid gap-2 lg:grid-cols-3">
              {query.data?.map((group) => (
                <FeeTable key={group.id} group={group} amount={amount} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
