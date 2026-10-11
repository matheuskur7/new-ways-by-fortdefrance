"use client";

import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authenticate, signOut } from "./auth";
import { listOrganizations, setActiveOrganization } from "./organizations";

export const organizationsQueryOptions = queryOptions({
  queryKey: ["organizations"],
  queryFn: ({ signal }) => listOrganizations(signal),
  staleTime: 30_000,
  retry: false,
});

export function useOrganizations() {
  return useQuery(organizationsQueryOptions);
}

// Cancel requests before clearing so late responses cannot repopulate the old cache.
export function useAuthenticate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: authenticate,
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
    },
  });
}

export function useSignOut() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: signOut,
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
    },
  });
}

export function useSetActiveOrganization() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: setActiveOrganization,
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
    },
  });
}
