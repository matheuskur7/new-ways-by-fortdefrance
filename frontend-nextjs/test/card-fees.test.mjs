import assert from "node:assert/strict"
import { test } from "node:test"
import { registerHooks } from "node:module"
import {
  maskCurrency,
  formatMoney,
  parseBrazilianAmount,
} from "../lib/masks.ts"

const resolver = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/masks")
      return nextResolve(
        new URL("../lib/masks.ts", import.meta.url).href,
        context
      )
    if (specifier === "./schemas" && context.parentURL?.includes("/taxas/")) {
      return nextResolve(
        new URL("../app/(private)/taxas/schemas.ts", import.meta.url).href,
        context
      )
    }
    return nextResolve(specifier, context)
  },
})
const { calculateCardFee } =
  await import("../app/(private)/taxas/calculator.ts")
const { saleAmountSchema, saleAmountFormSchema } =
  await import("../app/(private)/taxas/schemas.ts")
resolver.deregister()

test("interpreta valores brasileiros e rejeita formatos ambíguos", () => {
  assert.equal(parseBrazilianAmount("R$ 1.234,56"), 1234.56)
  assert.equal(parseBrazilianAmount("0,01"), 0.01)
  for (const text of ["", "1.23", "1,234.56", "-10", "abc", "1,234"]) {
    assert.equal(Number.isNaN(parseBrazilianAmount(text)), true)
  }
  for (const value of [0, -1, Infinity, NaN, 1_000_000_001]) {
    assert.equal(saleAmountSchema.safeParse(value).success, false)
  }
})

test("repasse da taxa preserva o valor líquido e divide o total em parcelas", () => {
  const result = calculateCardFee(1000, "3.94", 2)
  assert.ok(Math.abs(result.total * (1 - 0.0394) - 1000) < 0.00001)
  assert.equal(result.installment, result.total / 2)
  assert.deepEqual(calculateCardFee(1000, "0.00", 1), {
    total: 1000,
    installment: 1000,
  })
  for (const rate of ["100.00", "-1.00", "3,94"]) {
    assert.throws(() => calculateCardFee(1000, rate, 2))
  }
  assert.throws(() => calculateCardFee(1000, "3.94", 13))
})

test("máscara e formatação monetária compartilham o padrão brasileiro", () => {
  assert.equal(maskCurrency(""), "")
  assert.equal(maskCurrency("1"), "0,01")
  assert.equal(maskCurrency("123456"), "1.234,56")
  assert.equal(maskCurrency("R$ 1.234,56"), "1.234,56")
  assert.equal(formatMoney(1234.56).replaceAll("\u00a0", " "), "R$ 1.234,56")
  assert.equal(
    saleAmountFormSchema.safeParse({ amount: "1.234,56" }).success,
    true
  )
  assert.equal(
    saleAmountFormSchema.safeParse({ amount: "0,00" }).success,
    false
  )
})
