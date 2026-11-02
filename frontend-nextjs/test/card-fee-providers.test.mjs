import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { afterEach, mock, test } from "node:test"

const resolver = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/"))
      return nextResolve(
        new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href,
        context
      )
    if (
      specifier === "../schemas" &&
      context.parentURL?.includes("/taxas/services/")
    )
      return nextResolve(
        new URL("../app/(private)/taxas/schemas.ts", import.meta.url).href,
        context
      )
    return nextResolve(specifier, context)
  },
})
const { api } = await import("../lib/api.ts")
const { listCardFees } =
  await import("../app/(private)/taxas/services/list-card-fees.ts")
resolver.deregister()
afterEach(() => mock.restoreAll())

const providerA = {
  id: "019a1234-5678-7000-8000-123456789abc",
  name: "InfinitePay",
  logo: null,
}
const providerB = {
  id: "019a1234-5678-7000-8000-123456789def",
  name: "Outro provedor",
  logo: "<svg></svg>",
}
const brand = (id, provider) => ({
  id,
  provider,
  name: "Visa / Mastercard",
  channel: "Presencial",
  logo: null,
  rates: [{ installments: 1, ratePercent: "0.00" }],
})

test("carrega todos os provedores e bandeiras em uma requisição, preservando IDs para edição", async () => {
  const brands = [
    brand("019a1234-5678-7000-8000-123456789001", providerA),
    brand("019a1234-5678-7000-8000-123456789002", providerB),
    brand("019a1234-5678-7000-8000-123456789003", providerA),
  ]
  const signal = new AbortController().signal
  const get = mock.method(api, "get", async (path, options) => {
    assert.equal(path, "/card-fees")
    assert.equal(options.signal, signal)
    return { data: brands }
  })
  const providers = await listCardFees(signal)
  assert.equal(get.mock.callCount(), 1)
  assert.deepEqual(providers, [
    { ...providerA, brands: [brands[0], brands[2]] },
    { ...providerB, brands: [brands[1]] },
  ])
})

test("aceita lista vazia e rejeita bandeiras sem um provedor válido ou sem taxas", async () => {
  const get = mock.method(api, "get", async () => ({ data: [] }))
  assert.deepEqual(await listCardFees(), [])
  for (const provider of [
    null,
    { name: "InfinitePay", logo: null },
    { id: "019a1234-5678-7000-8000-123456789abc", name: "InfinitePay" },
    { id: "invalid", name: "InfinitePay" },
  ]) {
    get.mock.mockImplementation(async () => ({
      data: [brand("019a1234-5678-7000-8000-123456789001", provider)],
    }))
    await assert.rejects(listCardFees())
  }
})

test("rejeita o contrato antigo com logoSvg e bandeiras sem taxas", async () => {
  const valid = brand("019a1234-5678-7000-8000-123456789001", providerA)
  const { logo, ...legacy } = valid
  for (const data of [
    [{ ...legacy, logoSvg: logo }],
    [{ ...valid, rates: [] }],
  ]) {
    mock.method(api, "get", async () => ({ data }))
    await assert.rejects(listCardFees())
    mock.restoreAll()
  }
})
