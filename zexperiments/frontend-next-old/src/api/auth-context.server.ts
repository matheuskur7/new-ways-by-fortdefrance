import "server-only";

import { authContextSchema } from "@/lib/auth-schemas";

export async function fetchAuthContext(cookie: string) {
  const backend = process.env.BACKEND_URL ?? "http://localhost:5000";
  const response = await fetch(new URL("/auth/context", backend), {
    headers: { cookie },
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Não foi possível validar sua sessão.");
  return authContextSchema.parse(await response.json());
}
