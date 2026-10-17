import { z } from "zod";
import { feeGroupSchema } from "./schemas";
import { notifySessionExpired } from "../session";

export async function getFeeGroups(signal?: AbortSignal) {
  const response = await fetch("/api/card-fees", {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    if (response.status === 401) notifySessionExpired();
    throw new Error(
      response.status === 401
        ? "Sua sessão expirou. Entre novamente para consultar as taxas."
        : "Não foi possível consultar as taxas.",
    );
  }
  return z.array(feeGroupSchema).parse(await response.json());
}
