import assert from "node:assert/strict"
import { test } from "node:test"
import { envSchema } from "../lib/env.ts"

test("resolve a URL padrão quando não há configuração", () => {
  assert.deepEqual(envSchema.parse({}), { API_URL: "http://localhost:5000" })
})

test("prioriza API_URL e normaliza espaços e barras finais", () => {
  assert.deepEqual(
    envSchema.parse({
      API_URL: " https://api.example.com/// ",
      NEXT_PUBLIC_API_URL: "https://legacy.example.com",
    }),
    { API_URL: "https://api.example.com" }
  )
})

test("preserva o fallback legado e trata valores vazios como ausentes", () => {
  assert.deepEqual(
    envSchema.parse({
      API_URL: "  ",
      NEXT_PUBLIC_API_URL: "https://legacy.example.com/",
    }),
    { API_URL: "https://legacy.example.com" }
  )
  assert.deepEqual(envSchema.parse({ API_URL: "", NEXT_PUBLIC_API_URL: " " }), {
    API_URL: "http://localhost:5000",
  })
})

test("rejeita URLs inválidas, protocolos inadequados e valores não textuais", () => {
  for (const name of ["API_URL", "NEXT_PUBLIC_API_URL"]) {
    for (const value of [
      "invalid",
      "ftp://api.example.com",
      "javascript:alert(1)",
      5000,
    ]) {
      assert.equal(envSchema.safeParse({ [name]: value }).success, false)
    }
  }
})
