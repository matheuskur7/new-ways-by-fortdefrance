export function maskCurrency(value: string) {
  const digits = value.replace(/\D/g, "")
  return digits
    ? (Number(digits) / 100).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : ""
}

export function parseBrazilianAmount(value: string): number {
  const text = value.trim().replace(/^R\$\s*/, "")
  if (!/^(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$/.test(text)) return NaN
  return Number(text.replaceAll(".", "").replace(",", "."))
}
export const formatMoney = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
