import assert from "node:assert/strict"
import { test } from "node:test"
import {
  organizationListSchema,
  isOrganizationOwner,
  selectedOrganizationSchema,
  selectOrganizationSchema,
} from "../app/(auth)/organizations/schemas.ts"

test("interpreta empresas com os papéis retornados pelo backend", () => {
  const result = organizationListSchema.parse([
    {
      id: "org-a",
      name: "Empresa A",
      slug: "empresa-a",
      role: "owner",
      logo: null,
      createdAt: "2030-01-01",
    },
    { id: "org-b", name: "Empresa B", slug: "empresa-b", role: "member" },
  ])
  assert.deepEqual(result, [
    { id: "org-a", name: "Empresa A", slug: "empresa-a", role: "owner" },
    { id: "org-b", name: "Empresa B", slug: "empresa-b", role: "member" },
  ])
})

test("aceita uma lista vazia quando o usuário não pertence a empresas", () => {
  assert.deepEqual(organizationListSchema.parse([]), [])
})

test("rejeita respostas incompatíveis com o contrato", () => {
  for (const body of [
    null,
    {},
    { organizations: [] },
    [{ id: "org-a", name: "Empresa A" }],
    [{ id: "", name: "Empresa A", slug: "empresa-a", role: "owner" }],
  ]) {
    assert.equal(organizationListSchema.safeParse(body).success, false)
  }
})

test("identifica proprietário inclusive em vínculos com múltiplos papéis", () => {
  for (const role of ["owner", "admin,owner", "member, owner"])
    assert.equal(isOrganizationOwner(role), true)
  for (const role of ["member", "admin", "co-owner", "owner-assistant"])
    assert.equal(isOrganizationOwner(role), false)
})

test("valida o ID enviado ao selecionar a empresa", () => {
  assert.deepEqual(
    selectOrganizationSchema.parse({ organizationId: "org-a" }),
    { organizationId: "org-a" }
  )
  for (const body of [{}, { organizationId: "" }, { organizationId: null }]) {
    assert.equal(selectOrganizationSchema.safeParse(body).success, false)
  }
})

test("aceita a resposta nativa de seleção sem exigir papel do membro", () => {
  assert.deepEqual(
    selectedOrganizationSchema.parse({
      id: "org-a",
      name: "Empresa A",
      slug: "empresa-a",
      createdAt: "2030-01-01",
    }),
    {
      id: "org-a",
      name: "Empresa A",
      slug: "empresa-a",
    }
  )
  assert.equal(selectedOrganizationSchema.safeParse(null).success, false)
})

test("somente owner e admin podem gerenciar a empresa, inclusive com múltiplos papéis", async () => {
  const { canManageOrganization } =
    await import("../app/(auth)/organizations/schemas.ts")
  for (const role of ["owner", "admin", "member, admin", " admin,owner "])
    assert.equal(canManageOrganization(role), true)
  for (const role of [
    "member",
    "",
    "administrator",
    "superadmin",
    "owner-other",
  ])
    assert.equal(canManageOrganization(role), false)
})
