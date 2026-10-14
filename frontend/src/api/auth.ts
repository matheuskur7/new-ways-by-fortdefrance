"use client";

import { authClient } from "./auth-client";
import { setSigningOut } from "./session";
import { signInSchema, signUpSchema } from "@/lib/auth-schemas";

export async function authenticate({ mode, values }: {
  mode: "login" | "signup";
  values: Record<string, unknown>;
}) {
  const result = await (async () => {
    if (mode === "signup") {
      const input = signUpSchema.safeParse(values);
      if (!input.success) throw new Error(input.error.issues[0].message);
      return authClient.signUp.email(input.data);
    }
    const input = signInSchema.safeParse(values);
    if (!input.success) throw new Error(input.error.issues[0].message);
    return authClient.signIn.email(input.data);
  })();
  if (result.error) {
    throw new Error(result.error.message ?? (
      mode === "signup" ? "Não foi possível criar sua conta." : "Email ou senha inválidos."
    ));
  }
  setSigningOut(false);
  return result.data;
}

export async function signOut() {
  setSigningOut(true);
  try {
    const result = await authClient.signOut();
    if (result.error) throw new Error("Não foi possível sair. Tente novamente.");
  } catch (error) {
    setSigningOut(false);
    throw error;
  }
}
