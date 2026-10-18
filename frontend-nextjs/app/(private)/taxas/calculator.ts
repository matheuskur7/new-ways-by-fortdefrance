import { saleAmountSchema, feeRateSchema } from "./schemas"

export function calculateCardFee(
  amount: number,
  ratePercent: string,
  installments: number
) {
  saleAmountSchema.parse(amount)
  feeRateSchema.parse({ ratePercent, installments })
  const total = amount / (1 - Number(ratePercent) / 100)
  return { total, installment: total / installments }
}
