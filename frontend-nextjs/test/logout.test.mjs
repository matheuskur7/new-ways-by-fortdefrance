import assert from "node:assert/strict"
import { afterEach, mock, test } from "node:test"
import {
  completeSignOut,
  getSessionRevision,
  isSigningOut,
  signOut,
} from "../lib/logout.ts"

afterEach(() => {
  mock.restoreAll()
  completeSignOut()
})

test("encerra a sessão pelo endpoint nativo com cookies e invalida verificações antigas", async () => {
  const revision = getSessionRevision()
  const fetchMock = mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/backend/api/auth/sign-out")
    assert.equal(options.method, "POST")
    assert.equal(options.credentials, "include")
    assert.equal(options.cache, "no-store")
    assert.deepEqual(JSON.parse(options.body), {})
    return Response.json({ success: true })
  })
  await signOut()
  assert.equal(fetchMock.mock.callCount(), 1)
  assert.equal(isSigningOut(), true)
  assert.notEqual(getSessionRevision(), revision)
  completeSignOut()
  assert.equal(isSigningOut(), false)
})

test("cliques simultâneos compartilham a mesma requisição", async () => {
  let resolveResponse
  const response = new Promise((resolve) => {
    resolveResponse = resolve
  })
  const fetchMock = mock.method(globalThis, "fetch", () => response)
  const first = signOut()
  const second = signOut()
  assert.equal(first, second)
  resolveResponse(Response.json({ success: true }))
  await Promise.all([first, second])
  assert.equal(fetchMock.mock.callCount(), 1)
})

test("falhas HTTP liberam nova tentativa sem indicar saída concluída", async () => {
  const fetchMock = mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 503 })
  )
  await assert.rejects(signOut())
  assert.equal(isSigningOut(), false)
  fetchMock.mock.mockImplementation(async () =>
    Response.json({ success: true })
  )
  await signOut()
  assert.equal(fetchMock.mock.callCount(), 2)
})

test("falhas de rede liberam o monitor e não confirmam logout", async () => {
  mock.method(globalThis, "fetch", async () => {
    throw new TypeError("Falha simulada")
  })
  await assert.rejects(signOut())
  assert.equal(isSigningOut(), false)
})

test("respostas inválidas não são tratadas como logout bem-sucedido", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({ success: false })
  )
  await assert.rejects(signOut())
  assert.equal(isSigningOut(), false)
})
