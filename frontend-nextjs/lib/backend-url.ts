import { env } from "./env"

// Usado somente pelo Next.js; o navegador acessa o proxy /backend.
export function getBackendUrl() {
  return env.API_URL
}
