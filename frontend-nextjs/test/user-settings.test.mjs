import assert from "node:assert/strict"
import { registerHooks } from "node:module"
import { after, afterEach, mock, test } from "node:test"

// Resolve os mesmos aliases do Next para testar os services com HTTP simulado.
const resolver = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(
        new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href,
        context
      )
    }
    if (
      specifier === "../schemas" &&
      context.parentURL?.includes("user-settings/services/")
    ) {
      return nextResolve(
        new URL("../app/(auth)/user-settings/schemas.ts", import.meta.url).href,
        context
      )
    }
    return nextResolve(specifier, context)
  },
})
const { api } = await import("../lib/api.ts")
const { updateUser } =
  await import("../app/(auth)/user-settings/services/update-user.ts")
resolver.deregister()
Object.defineProperty(globalThis, "window", {
  value: { location: { origin: "https://app.example.com" } },
  configurable: true,
})
after(() => {
  delete globalThis.window
})
afterEach(() => mock.restoreAll())

const id = "019a1234-5678-7000-8000-123456789abc"
const signed = "https://s3.example.com/upload?signature=temporary"
const photo = new Blob(["cropped-photo"], { type: "image/png" })

function setup({
  uploadStatus = 200,
  completeStatus = "ready",
  headers = { "If-None-Match": "*" },
} = {}) {
  const calls = []
  mock.method(api, "post", async (path, data) => {
    calls.push({ path, data })
    if (path === "/user-images/upload-url")
      return {
        data: {
          id,
          url: signed,
          method: "PUT",
          headers,
        },
      }
    if (path === `/user-images/${id}/complete`)
      return { data: { id, status: completeStatus } }
    if (
      path === "/api/auth/update-user" ||
      path === `/user-images/${id}/attach`
    )
      return { data: { status: true } }
    throw new Error("Requisição inesperada")
  })
  mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ path: url, options })
    return new Response(null, { status: uploadStatus })
  })
  return calls
}

test("salva o nome pela rota nativa sem enviar e-mail ou foto quando não foram alterados", async () => {
  const calls = setup()
  await updateUser({ name: " Novo nome ", email: "ignored@example.com" })
  assert.deepEqual(calls, [
    { path: "/api/auth/update-user", data: { name: "Novo nome" } },
  ])
})

test("envia a foto diretamente ao S3, confirma e só então salva uma referência estável", async () => {
  const calls = setup()
  await updateUser({ name: "Admin", image: photo })
  assert.deepEqual(
    calls.map(({ path }) => path),
    [
      "/user-images/upload-url",
      signed,
      `/user-images/${id}/complete`,
      `/user-images/${id}/attach`,
    ]
  )
  assert.deepEqual(calls[0].data, { key: "user-image" })
  assert.equal(calls[1].options.body, photo)
  assert.equal(calls[1].options.credentials, "omit")
  assert.deepEqual(calls[1].options.headers, {
    "If-None-Match": "*",
    "Content-Type": "image/png",
  })
  assert.deepEqual(calls[3].data, {
    name: "Admin",
  })
  assert.equal(JSON.stringify(calls[3].data).includes("signature"), false)
})

test("falha no S3 não confirma o upload nem altera o perfil", async () => {
  const calls = setup({ uploadStatus: 403 })
  await assert.rejects(updateUser({ name: "Admin", image: photo }))
  assert.equal(calls.length, 2)
})

test("imagem ainda pendente não é vinculada ao perfil", async () => {
  const calls = setup({ completeStatus: "pending" })
  await assert.rejects(updateUser({ name: "Admin", image: photo }))
  assert.equal(calls.length, 3)
})

test("nome inválido não inicia upload ou atualização", async () => {
  const calls = setup()
  await assert.rejects(updateUser({ name: "  ", image: photo }))
  assert.equal(calls.length, 0)
})

test("respeita o PUT simples retornado para Magalu sem inventar headers condicionais", async () => {
  const calls = setup({ headers: {} })
  await updateUser({ name: "Admin", image: photo })
  assert.deepEqual(calls[1].options.headers, { "Content-Type": "image/png" })
  assert.equal(calls.at(-1).path, `/user-images/${id}/attach`)
})

test("remove a foto sem upload e envia o nome junto ao endpoint de remoção", async () => {
  const calls = setup()
  const deletion = mock.method(api, "delete", async (path, options) => {
    assert.equal(path, "/user-images/current")
    assert.deepEqual(options.data, { name: "Admin" })
    return { data: { status: true } }
  })
  await updateUser({ name: "Admin", removeImage: true })
  assert.equal(deletion.mock.callCount(), 1)
  assert.equal(calls.length, 0)
})
