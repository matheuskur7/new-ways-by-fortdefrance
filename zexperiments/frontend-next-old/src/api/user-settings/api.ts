"use client";

import { z } from "zod";
import imageCompression from "browser-image-compression";
import { authClient } from "@/api/auth-client";
import { notifySessionExpired } from "../session";
import { avatarFileSchema, passwordSchema, profileSchema } from "./schemas";

async function readResponse(response: Response) {
  if (response.status === 401) notifySessionExpired();
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = z
      .object({ message: z.union([z.string(), z.array(z.string())]) })
      .safeParse(body);
    throw new Error(
      error.success
        ? [error.data.message].flat().join(" ")
        : "Não foi possível salvar. Tente novamente.",
    );
  }
  return body;
}

export async function prepareAvatar(file: File) {
  const input = avatarFileSchema.safeParse(file);
  if (!input.success) throw new Error(input.error.issues[0].message);
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 512,
    useWebWorker: false,
    fileType: "image/jpeg",
    initialQuality: 0.8,
  });
  if (compressed.size > 200 * 1024)
    throw new Error("Não foi possível reduzir a imagem. Escolha outra foto.");
  return compressed;
}

export async function saveProfile({
  name,
  file,
}: {
  name: string;
  file: File | null;
}) {
  const values = profileSchema.parse({ name });
  let imageKey: string | undefined;
  if (file) {
    const upload = z
      .object({ imageKey: z.string(), uploadUrl: z.url() })
      .parse(
        await readResponse(
          await fetch("/api/user-settings/avatar-upload", { method: "POST" }),
        ),
      );
    const response = await fetch(upload.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "image/jpeg" },
      body: file,
      credentials: "omit",
    });
    if (!response.ok)
      throw new Error("Não foi possível enviar a foto. Tente novamente.");
    imageKey = upload.imageKey;
  }
  z.object({ success: z.literal(true) }).parse(
    await readResponse(
      await fetch("/api/user-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, imageKey }),
      }),
    ),
  );
  await authClient.getSession({ query: { disableCookieCache: true } });
}

export async function changePassword(values: Record<string, unknown>) {
  const { currentPassword, newPassword } = passwordSchema.parse(values);
  const result = await authClient.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });
  if (result.error)
    throw new Error(
      result.error.code === "INVALID_PASSWORD"
        ? "A senha atual está incorreta."
        : "Não foi possível alterar a senha. Verifique a senha atual e tente novamente.",
    );
}

export async function removeAvatar() {
  z.object({ success: z.literal(true) }).parse(
    await readResponse(
      await fetch("/api/user-settings/avatar", { method: "DELETE" }),
    ),
  );
  await authClient.getSession({ query: { disableCookieCache: true } });
}
