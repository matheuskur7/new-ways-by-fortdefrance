import assert from "node:assert/strict"
import { test } from "node:test"
import {
  getSessionRedirect,
  hasSessionToken,
  readSession,
} from "../lib/session.ts"

const session = {
  session: {
    id: "session-example",
    expiresAt: "2030-01-01T12:00:00.000Z",
    token: "not-exposed-by-the-helper",
  },
  user: { id: "user-example", name: "Usuário", email: "user@example.com" },
}

test("interpreta uma sessão válida sem repassar o token do backend", async () => {
  const result = await readSession(Response.json(session))
  assert.equal(result.user.id, session.user.id)
  assert.equal(
    result.session.expiresAt.toISOString(),
    session.session.expiresAt
  )
  assert.equal("token" in result.session, false)
})

test("somente null ou 401 comprovam ausência de sessão", async () => {
  assert.equal(await readSession(Response.json(null)), null)
  assert.equal(await readSession(new Response(null, { status: 401 })), null)
})

test("erros de servidor não são interpretados como logout", async () => {
  for (const status of [403, 429, 500, 502, 503]) {
    await assert.rejects(readSession(new Response(null, { status })))
  }
})

test("respostas inesperadas e JSON inválido não são interpretados como logout", async () => {
  for (const body of [{}, { session: null }, { ...session, user: null }]) {
    await assert.rejects(readSession(Response.json(body)))
  }
  await assert.rejects(readSession(new Response("unavailable")))
})

test("login com sessão válida encaminha para organizações", () => {
  assert.equal(getSessionRedirect("/login", session), "/organizations")
  assert.equal(getSessionRedirect("/login", null), null)
})

test("páginas autenticadas sem sessão encaminham para o login", () => {
  for (const pathname of ["/", "/organizations"]) {
    assert.equal(
      getSessionRedirect(pathname, null),
      "/login?reason=session-expired"
    )
    assert.equal(getSessionRedirect(pathname, session), null)
  }
})

test("somente cookies de sessão identificam uma sessão anterior no servidor", () => {
  for (const cookie of [
    "",
    "theme=light",
    "better-auth.session_token=",
    "other=better-auth.session_token=token",
  ]) {
    assert.equal(hasSessionToken(cookie), false)
  }
  assert.equal(
    hasSessionToken("theme=light; better-auth.session_token=token"),
    true
  )
  assert.equal(
    hasSessionToken("__Secure-better-auth.session_token=token"),
    true
  )
})
