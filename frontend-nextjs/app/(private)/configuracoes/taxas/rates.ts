import type { BrandForm } from "./schemas"

/** Gera as parcelas de 1 a `count`, preservando os percentuais já informados. */
export function resizeRates(rates: BrandForm["rates"], count: number) {
  const byInstallment = new Map(
    rates.map((rate) => [rate.installments, rate.ratePercent])
  )
  return Array.from({ length: count }, (_, index) => ({
    installments: index + 1,
    ratePercent: byInstallment.get(index + 1) ?? "",
  }))
}
