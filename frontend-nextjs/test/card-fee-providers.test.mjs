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
}
const providerB = {
  id: "019a1234-5678-7000-8000-123456789def",
  name: "Outro provedor",
}
const group = (id, provider) => ({
  id,
  provider,
  name: "Visa / Mastercard",
  channel: "Presencial",
  logoSvg: null,
  rates: [{ installments: 1, ratePercent: "0.00" }],
})

test("carrega todos os provedores e grupos em uma requisição, preservando IDs para edição", async () => {
  const groups = [
    group("019a1234-5678-7000-8000-123456789001", providerA),
    group("019a1234-5678-7000-8000-123456789002", providerB),
    group("019a1234-5678-7000-8000-123456789003", providerA),
  ]
  const signal = new AbortController().signal
  const get = mock.method(api, "get", async (path, options) => {
    assert.equal(path, "/card-fees")
    assert.equal(options.signal, signal)
    return { data: groups }
  })
  const providers = await listCardFees(signal)
  assert.equal(get.mock.callCount(), 1)
  assert.deepEqual(providers, [
    { ...providerA, groups: [groups[0], groups[2]] },
    { ...providerB, groups: [groups[1]] },
  ])
})

test("aceita lista vazia e rejeita grupos sem um provedor válido", async () => {
  const get = mock.method(api, "get", async () => ({ data: [] }))
  assert.deepEqual(await listCardFees(), [])
  for (const provider of [
    null,
    { name: "InfinitePay" },
    { id: "invalid", name: "InfinitePay" },
  ]) {
    get.mock.mockImplementation(async () => ({
      data: [group("019a1234-5678-7000-8000-123456789001", provider)],
    }))
    await assert.rejects(listCardFees())
  }
})
