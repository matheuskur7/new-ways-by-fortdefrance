import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authContextSchema } from "./auth-schemas";

// React cache deduplicates within this render, without sharing sessions across users.
export const getAuthContext = cache(async () => {
  const cookie = (await headers()).get("cookie");
  if (!cookie) return null;
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
});

export async function requireSession() {
  const context = await getAuthContext();
  if (!context) redirect("/login");
  return context;
}

export async function requireOrganization() {
  const context = await requireSession();
  if (!context.organization) redirect("/organizations");
  return { user: context.user, organization: context.organization };
}
