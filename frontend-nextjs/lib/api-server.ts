import "server-only"

import { headers } from "next/headers"
import { getBackendUrl } from "@/lib/backend-url"

// Requisições autenticadas do servidor nunca compartilham cache entre usuários.
export async function serverGet(path: string) {
  const cookie = (await headers()).get("cookie") ?? ""
  return fetch(`${getBackendUrl()}${path}`, {
    headers: { cookie },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
}
