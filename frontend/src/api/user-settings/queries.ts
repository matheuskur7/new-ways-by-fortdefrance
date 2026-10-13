"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword, removeAvatar, saveProfile } from "./api";

export function useSaveProfile() {
  const client = useQueryClient();
  return useMutation({ mutationFn: saveProfile, retry: false, onSuccess: () => client.invalidateQueries({ queryKey: ["auth-context"] }) });
}
export function useChangePassword() {
  return useMutation({ mutationFn: changePassword, retry: false });
}

export function useRemoveAvatar() {
  const client = useQueryClient();
  return useMutation({ mutationFn: removeAvatar, retry: false, onSuccess: () => client.invalidateQueries({ queryKey: ["auth-context"] }) });
}
