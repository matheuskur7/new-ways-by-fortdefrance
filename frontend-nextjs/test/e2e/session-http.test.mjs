import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { once } from "node:events"
import { createServer } from "node:http"
import { after, before, test } from "node:test"
import { setTimeout as delay } from "node:timers/promises"
import { fileURLToPath } from "node:url"

let frontend
let origin
const queries = []
const fixture = {
  session: { id: "session-example", expiresAt: "2030-01-01T12:00:00Z" },
  user: { id: "user-example", name: "Usuário", email: "user@example.com" },
}

// Somente o backend é simulado; as páginas e redirects são do Next.js real.
const backend = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost")
  assert.equal(url.pathname, "/api/auth/get-session")
  queries.push(url.searchParams)
  res.setHeader("Content-Type", "application/json")
  res.setHeader("Cache-Control", "no-store")
  if (req.headers.cookie === "session=server-error") {
    res.writeHead(503).end(JSON.stringify({ message: "Unavailable" }))
  } else if (req.headers.cookie === "better-auth.session_token=unauthorized") {
    res.writeHead(401).end()
  } else {
    res.end(
      JSON.stringify(req.headers.cookie === "session=valid" ? fixture : null)
    )
  }
})

before(async () => {
  backend.listen(0, "127.0.0.1")
  await once(backend, "listening")
  const backendUrl = `http://127.0.0.1:${backend.address().port}`

  const portProbe = createServer()
  portProbe.listen(0, "127.0.0.1")
  await once(portProbe, "listening")
  const port = portProbe.address().port
  await new Promise((resolve) => portProbe.close(resolve))
  origin = `http://127.0.0.1:${port}`

  frontend = spawn(
    process.execPath,
    [
      fileURLToPath(
        new URL("../../node_modules/next/dist/bin/next", import.meta.url)
      ),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: fileURLToPath(new URL("../../", import.meta.url)),
      env: {
        ...process.env,
        API_URL: backendUrl,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      stdio: "ignore",
    }
  )
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/login`)
      await response.text()
      if (response.ok) return
    } catch {
      // O servidor ainda está iniciando.
    }
    if (frontend.exitCode !== null)
      throw new Error(
        "O Next.js não iniciou. Gere o build antes dos testes HTTP."
      )
    await delay(100)
  }
  throw new Error("O Next.js não iniciou dentro do prazo.")
})

after(async () => {
  if (frontend && frontend.exitCode === null) {
    frontend.kill("SIGTERM")
    await once(frontend, "exit")
  }
  backend.closeAllConnections()
  await new Promise((resolve) => backend.close(resolve))
})

async function open(pathname, cookie) {
  const response = await fetch(`${origin}${pathname}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  })
  await response.text()
  return response
}

test("visitante vê login e é redirecionado ao acessar páginas privadas", async () => {
  assert.equal((await open("/login")).status, 200)
  const protectedPage = await open("/")
  assert.equal(protectedPage.status, 307)
  assert.equal(protectedPage.headers.get("location"), "/login")
  const response = await open("/", "theme=light")
  assert.equal(response.headers.get("location"), "/login")
})

test("sessão válida sai do login e acessa páginas privadas", async () => {
  const response = await open("/login", "session=valid")
  assert.equal(response.status, 307)
  assert.equal(response.headers.get("location"), "/organizations")
  assert.equal((await open("/", "session=valid")).status, 200)
  assert.ok(queries.length > 0)
  for (const params of queries) {
    assert.equal(params.get("disableCookieCache"), "true")
    assert.equal(params.get("disableRefresh"), "true")
  }
})

test("cookie inválido ou resposta 401 não libera acesso", async () => {
  for (const cookie of [
    "better-auth.session_token=invalid",
    "better-auth.session_token=unauthorized",
    "__Secure-better-auth.session_token=invalid",
  ]) {
    const response = await open("/", cookie)
    assert.equal(response.status, 307)
    assert.equal(
      response.headers.get("location"),
      "/login?reason=session-expired"
    )
  }
})

test("erro do backend não redireciona o usuário para o login", async () => {
  const response = await open("/", "session=server-error")
  assert.equal(response.status, 500)
  assert.equal(response.headers.get("location"), null)
})
