import { z } from "zod";
import { ratePercentSchema } from "../../api/card-fees/schemas.ts";

export function parseBrazilianAmount(value: string): number {
  const text = value.trim().replace(/^R\$\s*/, "");
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(text)) return NaN;
  return Number(text.replaceAll(".", "").replace(",", "."));
}
export const saleAmountSchema = z
  .number()
  .finite()
  .positive()
  .max(1_000_000_000);
export function calculateCardFee(
  amount: number,
  ratePercent: string,
  installments: number,
) {
  saleAmountSchema.parse(amount);
  ratePercentSchema.parse(ratePercent);
  z.number().int().min(1).max(12).parse(installments);
  const total = amount / (1 - Number(ratePercent) / 100);
  return { total, installment: total / installments };
}
export const formatMoney = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
