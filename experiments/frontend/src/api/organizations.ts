"use client";

import { z } from "zod";
import { notifySessionExpired } from "./session";
import { authClient } from "./auth-client";

const organizationsSchema = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    role: z.string(),
  }),
);

export async function listOrganizations(signal?: AbortSignal) {
  const response = await fetch("/api/organizations", {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    if (response.status === 401) notifySessionExpired();
    throw new Error("Não foi possível carregar as empresas.");
  }
  return organizationsSchema.parse(await response.json());
}

export async function setActiveOrganization(organizationId: string) {
  const result = await authClient.organization.setActive({ organizationId });
  if (result.error)
    throw new Error(
      result.error.message ?? "Não foi possível selecionar a empresa.",
    );
}
