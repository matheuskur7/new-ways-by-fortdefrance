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
      specifier === "../management-schemas" &&
      context.parentURL?.includes("configuracoes/taxas/services/")
    )
      return nextResolve(
        new URL(
          "../app/(private)/configuracoes/taxas/management-schemas.ts",
          import.meta.url
        ).href,
        context
      )
    return nextResolve(specifier, context)
  },
})
const { api } = await import("../lib/api.ts")
const {
  listFeeCatalog,
  saveFeeProvider,
  saveFeeGroup,
  saveFeeRate,
  removeFeeResource,
  reorderFeeGroups,
} =
  await import("../app/(private)/configuracoes/taxas/services/card-fee-management.ts")
resolver.deregister()
afterEach(() => mock.restoreAll())

const providerId = "019a1234-5678-7000-8000-123456789001"
const groupId = "019a1234-5678-7000-8000-123456789002"
const rateId = "019a1234-5678-7000-8000-123456789003"
const group = {
  providerId,
  name: "Visa",
  channel: "Presencial",
  displayOrder: 10,
  logoSvg: "",
  rates: Array.from({ length: 18 }, (_, i) => ({
    installments: i + 1,
    ratePercent: "3,94",
  })),
}

test("carrega catálogo com cancelamento e inclui provedores sem grupos", async () => {
  const signal = new AbortController().signal
  mock.method(api, "get", async (path, options) => {
    assert.equal(path, "/card-fees/catalog")
    assert.equal(options.signal, signal)
    return {
      data: { providers: [{ id: providerId, name: "Provedor" }], groups: [] },
    }
  })
  assert.equal((await listFeeCatalog(signal)).providers.length, 1)
})

test("cria e edita provedores validando a resposta", async () => {
  mock.method(api, "post", async (path, data) => {
    assert.equal(path, "/card-fees/providers")
    assert.deepEqual(data, { name: "Nome" })
    return { data: { ...data, id: providerId } }
  })
  assert.equal((await saveFeeProvider({ name: " Nome " })).id, providerId)
  mock.method(api, "patch", async (path) => {
    assert.equal(path, `/card-fees/providers/${providerId}`)
    return { data: { id: groupId, name: "Nome" } }
  })
  await assert.rejects(
    saveFeeProvider({ name: "Nome" }, providerId),
    /incompatível/
  )
})

test("salva grupo e quantidade variável de taxas com decimais exatos e logo nulo", async () => {
  mock.method(api, "post", async (path, data) => {
    assert.equal(path, "/card-fees/groups")
    assert.equal(data.logoSvg, null)
    assert.equal(data.rates.length, 18)
    assert.equal(data.rates[17].installments, 18)
    assert.equal(data.rates[17].ratePercent, "3.94")
    assert.equal("organizationId" in data, false)
    return {
      data: {
        ...data,
        id: groupId,
        rates: data.rates.map((rate) => ({ ...rate, id: rateId })),
      },
    }
  })
  assert.equal((await saveFeeGroup(group)).rates.length, 18)
  mock.method(api, "patch", async (path, data) => {
    assert.equal(path, `/card-fees/groups/${groupId}`)
    return { data: { ...data, id: groupId, providerId: rateId, rates: [] } }
  })
  await assert.rejects(saveFeeGroup(group, groupId), /incompatível/)
})

test("edita taxa por ID e grupo e não envia percentuais inválidos", async () => {
  const patch = mock.method(api, "patch", async (path, data) => {
    assert.equal(path, `/card-fees/groups/${groupId}/rates/${rateId}`)
    assert.deepEqual(data, { installments: 24, ratePercent: "8.99" })
    return { data: { ...data, id: rateId } }
  })
  await saveFeeRate(groupId, { installments: 24, ratePercent: "8,99" }, rateId)
  await assert.rejects(
    saveFeeRate(groupId, { installments: 1, ratePercent: "100" }, rateId)
  )
  assert.equal(patch.mock.callCount(), 1)
})

test("falhas HTTP e respostas malformadas não são sucesso", async () => {
  mock.method(api, "post", async () => {
    throw new Error("HTTP 409")
  })
  await assert.rejects(saveFeeProvider({ name: "Nome" }), /HTTP 409/)
  mock.method(api, "get", async () => ({
    data: { providers: [], groups: [{ id: "invalid" }] },
  }))
  await assert.rejects(listFeeCatalog())
})

test("remove provedor/grupo pelo ID e exige confirmação 204 do servidor", async () => {
  const calls = []
  mock.method(api, "delete", async (path) => {
    calls.push(path)
    return { status: 204 }
  })
  await removeFeeResource("provider", providerId)
  await removeFeeResource("group", groupId)
  assert.deepEqual(calls, [
    `/card-fees/providers/${providerId}`,
    `/card-fees/groups/${groupId}`,
  ])
  await assert.rejects(removeFeeResource("group", "invalid"))
  assert.equal(calls.length, 2)
})

test("remoções com erro ou status inesperado não são confirmadas", async () => {
  mock.method(api, "delete", async () => ({ status: 200 }))
  await assert.rejects(
    removeFeeResource("provider", providerId),
    /não foi confirmada/
  )
  mock.restoreAll()
  mock.method(api, "delete", async () => {
    throw new Error("HTTP 409")
  })
  await assert.rejects(removeFeeResource("provider", providerId), /HTTP 409/)
})

test("persiste a ordem dos grupos sem sobrescrever dados e taxas", async () => {
  const patch = mock.method(api, "patch", async (path, body) => {
    assert.equal(path, `/card-fees/providers/${providerId}/groups/order`)
    assert.deepEqual(body, { groupIds: [groupId, rateId] })
    return { status: 204 }
  })
  await reorderFeeGroups(providerId, [groupId, rateId])
  await assert.rejects(reorderFeeGroups(providerId, [groupId, groupId]))
  await assert.rejects(reorderFeeGroups(providerId, []))
  assert.equal(patch.mock.callCount(), 1)
})
