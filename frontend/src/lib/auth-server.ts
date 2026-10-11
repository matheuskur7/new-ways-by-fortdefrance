import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchAuthContext } from "@/api/auth-context.server";

// React cache deduplicates within this render, without sharing sessions across users.
export const getAuthContext = cache(async () => {
  const cookie = (await headers()).get("cookie");
  if (!cookie) return null;
  return fetchAuthContext(cookie);
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
