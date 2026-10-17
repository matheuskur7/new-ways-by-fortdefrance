"use client";

import { z } from "zod";
import { authClient } from "../auth-client";
import { notifySessionExpired } from "../session";
import { organizationSchema } from "@/lib/auth-schemas";
import {
  companySchema,
  invitationDetailsSchema,
  invitationSchema,
  inviteMemberSchema,
  organizationIdSchema,
  organizationSettingsSchema,
} from "./schemas";

function fail(
  error: { code?: string; message?: string; status?: number },
  fallback: string,
): never {
  if (error.status === 401) notifySessionExpired();
  if (error.status === 429)
    throw new Error("Muitas tentativas. Aguarde um minuto.");
  if (
    error.code === "ORGANIZATION_ALREADY_EXISTS" ||
    error.code === "ORGANIZATION_SLUG_ALREADY_TAKEN"
  )
    throw new Error("Já existe uma empresa com esse código.");
  if (error.code === "USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION")
    throw new Error("Este usuário já participa da empresa.");
  if (error.code === "USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION")
    throw new Error("Já existe um convite pendente para este e-mail.");
  throw new Error(error.message || fallback);
}

export async function createOrganization(values: Record<string, unknown>) {
  const input = organizationSchema.safeParse(values);
  if (!input.success) throw new Error(input.error.issues[0].message);
  const result = await authClient.organization.create({
    ...input.data,
    keepCurrentActiveOrganization: true,
  });
  if (result.error) fail(result.error, "Não foi possível criar a empresa.");
  return companySchema.parse(result.data);
}

export async function getOrganizationSettings(
  organizationId: string,
  signal?: AbortSignal,
) {
  const id = organizationIdSchema.parse(organizationId);
  const response = await fetch(
    `/api/organizations/${encodeURIComponent(id)}/settings`,
    { credentials: "same-origin", cache: "no-store", signal },
  );
  if (!response.ok) {
    if (response.status === 401) notifySessionExpired();
    throw new Error(
      response.status === 403
        ? "Você não tem permissão para gerenciar esta empresa."
        : "Não foi possível carregar a empresa.",
    );
  }
  return organizationSettingsSchema.parse(await response.json());
}

export async function inviteMember({
  organizationId,
  values,
  resend = false,
}: {
  organizationId: string;
  values: Record<string, unknown>;
  resend?: boolean;
}) {
  const input = inviteMemberSchema.safeParse(values);
  if (!input.success) throw new Error(input.error.issues[0].message);
  const result = await authClient.organization.inviteMember({
    organizationId: organizationIdSchema.parse(organizationId),
    ...input.data,
    resend,
  });
  if (result.error) fail(result.error, "Não foi possível enviar o convite.");
  return invitationSchema.parse(result.data);
}

export async function cancelInvitation(invitationId: string) {
  const result = await authClient.organization.cancelInvitation({
    invitationId: organizationIdSchema.parse(invitationId),
  });
  if (result.error) fail(result.error, "Não foi possível cancelar o convite.");
  return invitationSchema.parse(result.data);
}

export async function getInvitation(
  invitationId: string,
  signal?: AbortSignal,
) {
  const result = await authClient.organization.getInvitation({
    query: { id: organizationIdSchema.parse(invitationId) },
    fetchOptions: { signal },
  });
  if (result.error)
    fail(result.error, "Convite indisponível, expirado ou de outra conta.");
  return invitationDetailsSchema.parse(result.data);
}

export async function acceptInvitation(invitationId: string) {
  const result = await authClient.organization.acceptInvitation({
    invitationId: organizationIdSchema.parse(invitationId),
  });
  if (result.error) fail(result.error, "Não foi possível aceitar o convite.");
  z.object({ member: z.object({ organizationId: z.string() }) }).parse(
    result.data,
  );
}

export async function updateOrganization({
  organizationId,
  values,
}: {
  organizationId: string;
  values: Record<string, unknown>;
}) {
  const data = organizationSchema.parse(values);
  const result = await authClient.organization.update({
    organizationId: organizationIdSchema.parse(organizationId),
    data,
  });
  if (result.error) fail(result.error, "Não foi possível atualizar a empresa.");
  return companySchema.parse(result.data);
}

export async function updateMemberRole({
  organizationId,
  memberId,
  role,
}: {
  organizationId: string;
  memberId: string;
  role: "member" | "admin";
}) {
  const result = await authClient.organization.updateMemberRole({
    organizationId: organizationIdSchema.parse(organizationId),
    memberId: organizationIdSchema.parse(memberId),
    role: z.enum(["member", "admin"]).parse(role),
  });
  if (result.error)
    fail(result.error, "Não foi possível atualizar a permissão.");
}
