import "server-only";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { organizationSettingsSchema } from "./schemas";

export async function fetchOrganizationSettings(id: string) {
  const cookie = (await headers()).get("cookie") ?? "";
  const response = await fetch(
    new URL(
      `/api/organizations/${encodeURIComponent(id)}/settings`,
      process.env.BACKEND_URL ?? "http://localhost:5000",
    ),
    {
      headers: { cookie },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    },
  );
  if ([403, 404].includes(response.status)) notFound();
  if (!response.ok)
    throw new Error("Não foi possível carregar as configurações da empresa.");
  return organizationSettingsSchema.parse(await response.json());
}
