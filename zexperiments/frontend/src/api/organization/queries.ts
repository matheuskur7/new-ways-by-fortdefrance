"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  updateOrganization,
  updateMemberRole,
  acceptInvitation,
  cancelInvitation,
  createOrganization,
  getInvitation,
  getOrganizationSettings,
  inviteMember,
} from "./api";
import type { OrganizationSettingsData } from "./schemas";

export function useCreateOrganization() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createOrganization,
    retry: false,
    onSuccess: () => client.invalidateQueries({ queryKey: ["organizations"] }),
  });
}
export function useOrganizationSettings(
  id: string,
  initialData: OrganizationSettingsData,
) {
  return useQuery({
    queryKey: ["organization-settings", id],
    queryFn: ({ signal }) => getOrganizationSettings(id, signal),
    initialData,
    staleTime: 30_000,
    retry: false,
  });
}
export function useInviteMember(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: inviteMember,
    retry: false,
    onSettled: () =>
      client.invalidateQueries({ queryKey: ["organization-settings", id] }),
  });
}
export function useCancelInvitation(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: cancelInvitation,
    retry: false,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["organization-settings", id] }),
  });
}
export function useInvitation(id: string) {
  return useQuery({
    queryKey: ["invitation", id],
    queryFn: ({ signal }) => getInvitation(id, signal),
    retry: false,
  });
}
export function useAcceptInvitation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: acceptInvitation,
    retry: false,
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
    },
  });
}

export function useUpdateOrganization(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateOrganization,
    retry: false,
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["organization-settings", id] }),
        client.invalidateQueries({ queryKey: ["organizations"] }),
      ]);
    },
  });
}
export function useUpdateMemberRole(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateMemberRole,
    retry: false,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ["organization-settings", id] }),
  });
}
