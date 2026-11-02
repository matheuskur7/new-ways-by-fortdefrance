import assert from "node:assert/strict"
import { test } from "node:test"
import {
  providerFormSchema,
  groupFormSchema,
  rateFormSchema,
} from "../app/(private)/configuracoes/taxas/management-schemas.ts"

test("cadastros de provedores e grupos rejeitam nomes vazios e normalizam espaços", () => {
  assert.equal(providerFormSchema.safeParse({ name: "   " }).success, false)
  assert.equal(
    providerFormSchema.parse({ name: " InfinitePay " }).name,
    "InfinitePay"
  )
  const group = {
    providerId: "local-provider",
    name: "Visa",
    channel: "Presencial",
    displayOrder: 100,
    logoSvg: "",
    rates: [{ installments: 1, ratePercent: "0,00" }],
  }
  assert.equal(groupFormSchema.safeParse(group).success, true)
  for (const change of [
    { providerId: "" },
    { name: " " },
    { channel: " " },
    { displayOrder: 1.5 },
    { displayOrder: NaN },
    { logoSvg: "https://example.com/logo.png" },
  ]) {
    assert.equal(
      groupFormSchema.safeParse({ ...group, ...change }).success,
      false
    )
  }
})

test("taxas aceitam limites do banco e decimais brasileiros sem arredondar entradas inválidas", () => {
  for (const ratePercent of ["0", "0,00", "3.94", "99,99"]) {
    assert.equal(
      rateFormSchema.safeParse({ installments: 12, ratePercent }).success,
      true
    )
  }
  for (const ratePercent of [
    "",
    "-1",
    "100",
    "100,00",
    "3,999",
    "NaN",
    "1e1",
  ]) {
    assert.equal(
      rateFormSchema.safeParse({ installments: 1, ratePercent }).success,
      false
    )
  }
  for (const installments of [0, 32768, 1.5, NaN]) {
    assert.equal(
      rateFormSchema.safeParse({ installments, ratePercent: "1,00" }).success,
      false
    )
  }
})

test("grupos aceitam quantidades variáveis, inclusive acima de 12, e rejeitam parcelas repetidas", () => {
  for (const count of [3, 5, 6, 9, 10, 11, 12, 18, 24]) {
    const data = {
      providerId: "provider",
      name: "Visa",
      channel: "Presencial",
      displayOrder: 10,
      logoSvg: "",
      rates: Array.from({ length: count }, (_, i) => ({
        installments: i + 1,
        ratePercent: "3,94",
      })),
    }
    assert.equal(groupFormSchema.safeParse(data).success, true)
    assert.equal(
      groupFormSchema.safeParse({
        ...data,
        rates: [data.rates[0], data.rates[0]],
      }).success,
      false
    )
  }
})
