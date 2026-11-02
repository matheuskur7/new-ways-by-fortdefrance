import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { afterEach, mock, test } from "node:test"

const settingsDir = "../app/(private)/configuracoes/taxas/"
const resolver = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/"))
      return nextResolve(
        new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href,
        context
      )
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.includes("configuracoes/taxas/")
    ) {
      const url = new URL(specifier, context.parentURL)
      if (!url.pathname.endsWith(".ts")) url.pathname += ".ts"
      return nextResolve(url.href, context)
    }
    return nextResolve(specifier, context)
  },
})
const { api } = await import("../lib/api.ts")
const services = await import(`${settingsDir}services/fee-settings.ts`)
const schemas = await import(`${settingsDir}schemas.ts`)
const { moveIds, nextDisplayOrder, applyOrder } = await import(
  `${settingsDir}reorder.ts`
)
const { resizeRates } = await import(`${settingsDir}rates.ts`)
const { settingsOverview, providerBrands } = await import(
  `${settingsDir}summary.ts`
)
resolver.deregister()
afterEach(() => mock.restoreAll())

const providerId = "019a1234-5678-7000-8000-123456789001"
const brandId = "019a1234-5678-7000-8000-123456789002"
const otherId = "019a1234-5678-7000-8000-123456789003"
const svg = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
const dates = {
  createdAt: "2026-01-01T10:00:00.000Z",
  updatedAt: "2026-02-01T12:30:00.000Z",
}
const provider = { id: providerId, name: "InfinitePay", logo: svg, ...dates }
const brand = {
  id: brandId,
  providerId,
  name: "Mastercard / Visa",
  channel: "Presencial",
  displayOrder: 0,
  logo: null,
  rates: [{ installments: 1, ratePercent: "3.90" }],
  ...dates,
}

test("carrega provedores e grupos do catálogo com cancelamento", async () => {
  const signal = new AbortController().signal
  mock.method(api, "get", async (path, options) => {
    assert.equal(path, "/card-fees/catalog")
    assert.equal(options.signal, signal)
    return { data: { providers: [provider], brands: [brand] } }
  })
  assert.deepEqual(await services.listFeeSettings(signal), {
    providers: [provider],
    brands: [brand],
  })
})

test("rejeita o catálogo no contrato antigo", async () => {
  mock.method(api, "get", async () => ({
    data: { providers: [{ id: providerId, name: "Antigo" }], groups: [] },
  }))
  await assert.rejects(services.listFeeSettings())
})

test("cria e edita provedor enviando logo nulo quando vazio", async () => {
  const post = mock.method(api, "post", async (path, body) => {
    assert.equal(path, "/card-fees/providers")
    return { data: { ...body, id: providerId, ...dates } }
  })
  await services.saveProvider({ name: " InfinitePay ", logo: "" })
  assert.deepEqual(post.mock.calls[0].arguments[1], {
    name: "InfinitePay",
    logo: null,
  })
  mock.method(api, "patch", async (path, body) => {
    assert.equal(path, `/card-fees/providers/${providerId}`)
    assert.equal(body.logo, svg)
    return { data: { ...body, id: otherId, ...dates } }
  })
  await assert.rejects(
    services.saveProvider({ name: "InfinitePay", logo: svg }, providerId),
    /incompatível/
  )
})

test("salva grupo com percentuais da API e ordem informada", async () => {
  const post = mock.method(api, "post", async (path, body) => {
    assert.equal(path, "/card-fees/brands")
    return { data: { ...body, id: brandId, ...dates } }
  })
  const saved = await services.saveBrand(providerId, 3, {
    name: "Elo / AmEx",
    channel: "Link de pagamento",
    logo: "",
    rates: [
      { installments: 1, ratePercent: "0" },
      { installments: 2, ratePercent: "3,9" },
    ],
  })
  assert.deepEqual(post.mock.calls[0].arguments[1], {
    providerId,
    name: "Elo / AmEx",
    channel: "Link de pagamento",
    displayOrder: 3,
    logo: null,
    rates: [
      { installments: 1, ratePercent: "0.00" },
      { installments: 2, ratePercent: "3.90" },
    ],
  })
  assert.equal(saved.id, brandId)
  mock.method(api, "patch", async (path, body) => {
    assert.equal(path, `/card-fees/brands/${brandId}`)
    return { data: { ...body, id: brandId, providerId: otherId, ...dates } }
  })
  await assert.rejects(
    services.saveBrand(providerId, 0, { ...brand, logo: "" }, brandId),
    /incompatível/
  )
})

test("remove e reordena somente com confirmação 204", async () => {
  const del = mock.method(api, "delete", async () => ({ status: 204 }))
  await services.removeProvider(providerId)
  await services.removeBrand(brandId)
  assert.deepEqual(
    del.mock.calls.map((call) => call.arguments[0]),
    [`/card-fees/providers/${providerId}`, `/card-fees/brands/${brandId}`]
  )
  del.mock.mockImplementation(async () => ({ status: 200 }))
  await assert.rejects(services.removeBrand(brandId), /não foi confirmada/)

  const patch = mock.method(api, "patch", async () => ({ status: 204 }))
  await services.reorderBrands(providerId, [otherId, brandId])
  assert.deepEqual(patch.mock.calls[0].arguments, [
    `/card-fees/providers/${providerId}/brands/order`,
    { brandIds: [otherId, brandId] },
  ])
  for (const ids of [[], [brandId, brandId], ["invalid"]])
    await assert.rejects(services.reorderBrands(providerId, ids))
  assert.equal(patch.mock.callCount(), 1)
})

test("valida formulários, logos SVG e percentuais", () => {
  const { providerFormSchema, brandFormSchema, toApiPercent, toFormPercent } =
    schemas
  assert.equal(
    providerFormSchema.safeParse({ name: "P", logo: "" }).success,
    true
  )
  assert.equal(
    providerFormSchema.safeParse({ name: "P", logo: svg }).success,
    true
  )
  for (const logo of ["<img src=x>", "https://example.com/logo.svg"])
    assert.equal(
      providerFormSchema.safeParse({ name: "P", logo }).success,
      false
    )
  assert.equal(
    providerFormSchema.safeParse({ name: " ", logo: "" }).success,
    false
  )
  const base = { name: "Visa", channel: "Presencial", logo: "" }
  for (const ratePercent of ["0", "3,9", "99,99", "12.5"])
    assert.equal(
      brandFormSchema.safeParse({
        ...base,
        rates: [{ installments: 1, ratePercent }],
      }).success,
      true
    )
  for (const ratePercent of ["", "100", "1,999", "-1"])
    assert.equal(
      brandFormSchema.safeParse({
        ...base,
        rates: [{ installments: 1, ratePercent }],
      }).success,
      false
    )
  assert.equal(brandFormSchema.safeParse({ ...base, rates: [] }).success, false)
  assert.equal(schemas.maxInstallments, 72)
  const ratesUpTo = (count) =>
    Array.from({ length: count }, (_, index) => ({
      installments: index + 1,
      ratePercent: "1,00",
    }))
  assert.equal(
    brandFormSchema.safeParse({ ...base, rates: ratesUpTo(72) }).success,
    true
  )
  assert.equal(
    brandFormSchema.safeParse({ ...base, rates: ratesUpTo(73) }).success,
    false
  )
  assert.equal(toApiPercent("3,9"), "3.90")
  assert.equal(toFormPercent("3.90"), "3,90")
})

test("ordena pela posição visual e acrescenta novos grupos ao final", () => {
  const ids = ["a", "b", "c", "d"]
  assert.deepEqual(moveIds(ids, "a", "c"), ["b", "c", "a", "d"])
  assert.deepEqual(moveIds(ids, "d", "a"), ["d", "a", "b", "c"])
  assert.equal(moveIds(ids, "a", "a"), ids)
  assert.equal(moveIds(ids, "x", "a"), ids)
  assert.deepEqual(ids, ["a", "b", "c", "d"])
  assert.equal(nextDisplayOrder([]), 0)
  assert.equal(nextDisplayOrder([0, 2, 1]), 3)
  assert.equal(nextDisplayOrder([32767]), 32767)
})

test("aplica a ordem em edição aos grupos atuais", () => {
  const items = ["a", "b", "c"].map((id) => ({ id }))
  assert.equal(applyOrder(items, null), items)
  assert.deepEqual(
    applyOrder(items, ["c", "a", "b"]).map((item) => item.id),
    ["c", "a", "b"]
  )
  // Removidos saem da ordem; novos entram no final.
  assert.deepEqual(
    applyOrder([...items.slice(1), { id: "d" }], ["c", "a", "b"]).map(
      (item) => item.id
    ),
    ["c", "b", "d"]
  )
})

test("gera parcelas contínuas preservando os percentuais informados", () => {
  const rates = [
    { installments: 1, ratePercent: "0,00" },
    { installments: 3, ratePercent: "4,98" },
  ]
  assert.deepEqual(resizeRates(rates, 4), [
    { installments: 1, ratePercent: "0,00" },
    { installments: 2, ratePercent: "" },
    { installments: 3, ratePercent: "4,98" },
    { installments: 4, ratePercent: "" },
  ])
  assert.deepEqual(resizeRates(rates, 1), [
    { installments: 1, ratePercent: "0,00" },
  ])
})

test("resume totais e a alteração mais recente da tela", () => {
  const later = "2026-03-01T09:00:00.000Z"
  assert.deepEqual(
    settingsOverview({
      providers: [provider],
      brands: [brand, { ...brand, id: otherId, name: "Elo", updatedAt: later }],
    }),
    {
      providerCount: 1,
      brandCount: 2,
      lastChange: { at: later, label: "Elo · InfinitePay" },
    }
  )
  assert.deepEqual(
    settingsOverview({ providers: [provider], brands: [] }).lastChange,
    { at: provider.updatedAt, label: "InfinitePay" }
  )
  assert.deepEqual(settingsOverview({ providers: [], brands: [] }), {
    providerCount: 0,
    brandCount: 0,
    lastChange: null,
  })
})

test("lista os grupos do provedor na ordem de exibição", () => {
  const settings = {
    providers: [provider],
    brands: [
      { ...brand, id: "b", name: "B", displayOrder: 1 },
      { ...brand, id: "x", providerId: otherId, displayOrder: 0 },
      { ...brand, id: "c", name: "C", displayOrder: 0 },
      { ...brand, id: "a", name: "A", displayOrder: 0 },
    ],
  }
  assert.deepEqual(
    providerBrands(settings, providerId).map((item) => item.id),
    ["a", "c", "b"]
  )
  assert.equal(settings.brands[0].id, "b")
})

test("exige datas de auditoria nas respostas do catálogo", async () => {
  const { createdAt, ...withoutCreation } = provider
  assert.equal(typeof createdAt, "string")
  mock.method(api, "get", async () => ({
    data: { providers: [withoutCreation], brands: [] },
  }))
  await assert.rejects(services.listFeeSettings())
})
