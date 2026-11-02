import assert from "node:assert/strict"
import { test } from "node:test"
import { safeNextPath, withNext } from "../lib/redirect.ts"

test("aceita somente caminhos internos como destino", () => {
  for (const path of ["/empresas", "/convite/abc?x=1", "/taxas#topo"]) {
    assert.equal(safeNextPath(path), path)
  }
  for (const value of [
    undefined,
    ["/empresas"],
    "",
    "empresas",
    "//evil.example.com",
    "/\\evil.example.com",
    "/\t/evil.example.com",
    "/ok\\..\\evil",
    "https://evil.example.com",
    "javascript:alert(1)",
  ]) {
    assert.equal(safeNextPath(value), "/empresas")
  }
})

test("preserva o destino codificado nos links de autenticação", () => {
  assert.equal(withNext("/entrar", undefined), "/entrar")
  assert.equal(
    withNext("/cadastro", "/convite/a b?x=1"),
    "/cadastro?next=%2Fconvite%2Fa%20b%3Fx%3D1"
  )
})
