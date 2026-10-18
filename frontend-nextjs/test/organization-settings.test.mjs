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
      context.parentURL?.includes("organization-settings/services/")
    )
      return nextResolve(
        new URL(
          "../app/(auth)/organization-settings/schemas.ts",
          import.meta.url
        ).href,
        context
      )
    return nextResolve(specifier, context)
  },
})
const { api } = await import("../lib/api.ts")
const { updateOrganization } =
  await import("../app/(auth)/organization-settings/services/update-organization.ts")
const { listOrganizationMembers } =
  await import("../app/(auth)/organization-settings/services/list-organization-members.ts")
const { updateMemberRole } =
  await import("../app/(auth)/organization-settings/services/update-member-role.ts")
resolver.deregister()
afterEach(() => mock.restoreAll())

const organization = {
  id: "org-a",
  name: "Empresa",
  slug: "empresa",
  email: "company@example.com",
  address: "Rua Exemplo, 123",
}
const member = {
  id: "member-a",
  organizationId: "org-a",
  userId: "user-a",
  role: "member",
  user: { id: "user-a", name: "Usuário", email: "user@example.com" },
}

test("atualiza nome, e-mail e endereço pela rota nativa sem enviar o código", async () => {
  const calls = []
  mock.method(api, "post", async (...args) => {
    calls.push(args)
    return { data: organization }
  })
  await updateOrganization("org-a", {
    name: " Empresa ",
    email: "company@example.com",
    address: " Rua Exemplo, 123 ",
    slug: "outro-codigo",
  })
  assert.deepEqual(calls, [
    [
      "/api/auth/organization/update",
      {
        organizationId: "org-a",
        data: {
          name: "Empresa",
          email: "company@example.com",
          address: "Rua Exemplo, 123",
        },
      },
    ],
  ])
})

test("permite limpar o e-mail e o endereço, preservando a empresa na resposta", async () => {
  let body
  mock.method(api, "post", async (_path, data) => {
    body = data
    return { data: { ...organization, email: null, address: null } }
  })
  const saved = await updateOrganization("org-a", {
    name: "Empresa",
    email: "",
    address: "",
  })
  assert.equal(body.data.email, null)
  assert.equal(body.data.address, null)
  assert.equal(saved.email, null)
  assert.equal(saved.address, null)
})

test("dados inválidos não iniciam atualizações e respostas de outra empresa são rejeitadas", async () => {
  const post = mock.method(api, "post", async () => ({
    data: { ...organization, id: "org-b" },
  }))
  for (const data of [
    { name: " ", email: "", address: "" },
    { name: "Empresa", email: "invalido", address: "" },
    { name: "Empresa", email: "", address: "x".repeat(501) },
  ])
    await assert.rejects(updateOrganization("org-a", data))
  assert.equal(post.mock.callCount(), 0)
  await assert.rejects(
    updateOrganization("org-a", { name: "Empresa", email: "", address: "" }),
    /empresa retornada/
  )
})

test("consulta membros com paginação, escopo explícito e cancelamento", async () => {
  let options
  const signal = new AbortController().signal
  mock.method(api, "get", async (path, config) => {
    assert.equal(path, "/api/auth/organization/list-members")
    options = config
    return { data: { members: [member], total: 11 } }
  })
  const result = await listOrganizationMembers("org-a", 1, signal)
  assert.deepEqual(options.params, {
    organizationId: "org-a",
    limit: 10,
    offset: 10,
    sortBy: "id",
    sortDirection: "asc",
  })
  assert.equal(options.signal, signal)
  assert.equal(result.total, 11)
})

test("rejeita membros de outra empresa ou uma resposta incompatível", async () => {
  mock.method(api, "get", async () => ({
    data: { members: [{ ...member, organizationId: "org-b" }], total: 1 },
  }))
  await assert.rejects(listOrganizationMembers("org-a", 0), /lista de membros/)
  mock.restoreAll()
  mock.method(api, "get", async () => ({ data: { members: [member] } }))
  await assert.rejects(listOrganizationMembers("org-a", 0))
})

test("altera cargo pela rota nativa, validando membro, empresa e resposta", async () => {
  const calls = []
  mock.method(api, "post", async (...args) => {
    calls.push(args)
    return { data: { ...member, role: "admin" } }
  })
  await updateMemberRole("org-a", { memberId: "member-a", role: "admin" })
  assert.deepEqual(calls, [
    [
      "/api/auth/organization/update-member-role",
      { organizationId: "org-a", memberId: "member-a", role: "admin" },
    ],
  ])
  await assert.rejects(
    updateMemberRole("org-a", { memberId: "member-a", role: "owner" })
  )
  assert.equal(calls.length, 1)
})

test("falhas HTTP e cargos não confirmados pelo backend não são tratados como sucesso", async () => {
  mock.method(api, "post", async () => ({ data: member }))
  await assert.rejects(
    updateMemberRole("org-a", { memberId: "member-a", role: "admin" }),
    /membro retornado/
  )
  mock.restoreAll()
  const failure = new Error("Falha simulada")
  mock.method(api, "post", async () => {
    throw failure
  })
  await assert.rejects(
    updateMemberRole("org-a", { memberId: "member-a", role: "admin" }),
    failure
  )
})
