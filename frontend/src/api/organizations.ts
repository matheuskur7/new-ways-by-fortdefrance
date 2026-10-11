"use client";

import { z } from "zod";
import { authClient } from "./auth-client";

const organizationsSchema = z.array(z.object({
  id: z.string(), name: z.string(), slug: z.string(),
}));

export async function listOrganizations(signal?: AbortSignal) {
  const result = await authClient.organization.list({ fetchOptions: { signal } });
  if (result.error) throw new Error(result.error.message ?? "Não foi possível carregar as empresas.");
  return organizationsSchema.parse(result.data);
}

export async function setActiveOrganization(organizationId: string) {
  const result = await authClient.organization.setActive({ organizationId });
  if (result.error) throw new Error(result.error.message ?? "Não foi possível selecionar a empresa.");
}
