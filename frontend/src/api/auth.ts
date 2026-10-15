"use client";

import { authClient } from "./auth-client";
import { setSigningOut } from "./session";
import {
  authStatusSchema,
  emailRequestSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth-schemas";

export async function authenticate({
  mode,
  values,
}: {
  mode: "login" | "signup";
  values: Record<string, unknown>;
}) {
  const result = await (async () => {
    if (mode === "signup") {
      const input = signUpSchema.safeParse(values);
      if (!input.success) throw new Error(input.error.issues[0].message);
      return authClient.signUp.email({
        ...input.data,
        callbackURL: new URL("/verify-email?verified=1", window.location.origin)
          .href,
      });
    }
    const input = signInSchema.safeParse(values);
    if (!input.success) throw new Error(input.error.issues[0].message);
    return authClient.signIn.email(input.data);
  })();
  if (result.error) {
    if (result.error.code === "EMAIL_NOT_VERIFIED")
      throw new EmailNotVerifiedError();
    if (result.error.status === 429)
      throw new Error(
        "Muitas tentativas. Aguarde um minuto e tente novamente.",
      );
    throw new Error(
      mode === "signup"
        ? "Não foi possível criar sua conta. Tente novamente."
        : "E-mail ou senha inválidos.",
    );
  }
  setSigningOut(false);
  return result.data;
}

export async function signOut() {
  setSigningOut(true);
  try {
    const result = await authClient.signOut();
    if (result.error)
      throw new Error("Não foi possível sair. Tente novamente.");
  } catch (error) {
    setSigningOut(false);
    throw error;
  }
}

export class EmailNotVerifiedError extends Error {
  constructor() {
    super("Confirme seu e-mail antes de entrar.");
  }
}

export async function requestAccountEmail({
  mode,
  values,
}: {
  mode: "verification" | "password-reset";
  values: Record<string, unknown>;
}) {
  const input = emailRequestSchema.safeParse(values);
  if (!input.success) throw new Error(input.error.issues[0].message);
  const result =
    mode === "verification"
      ? await authClient.sendVerificationEmail({
          ...input.data,
          callbackURL: new URL(
            "/verify-email?verified=1",
            window.location.origin,
          ).href,
        })
      : await authClient.requestPasswordReset({
          ...input.data,
          redirectTo: new URL("/reset-password", window.location.origin).href,
        });
  if (result.error) {
    if (result.error.status === 429)
      throw new Error(
        "Muitas solicitações. Aguarde um minuto antes de tentar novamente.",
      );
    throw new Error("Não foi possível solicitar o e-mail. Tente novamente.");
  }
  authStatusSchema.parse(result.data);
}

export async function resetPassword(values: Record<string, unknown>) {
  const input = resetPasswordSchema.safeParse(values);
  if (!input.success) throw new Error(input.error.issues[0].message);
  const { token, newPassword } = input.data;
  const result = await authClient.resetPassword({ token, newPassword });
  if (result.error) {
    if (result.error.status === 429)
      throw new Error(
        "Muitas tentativas. Aguarde um minuto e tente novamente.",
      );
    throw new Error(
      "Não foi possível redefinir a senha. O link pode estar inválido, expirado ou já ter sido utilizado. Solicite um novo e-mail.",
    );
  }
  authStatusSchema.parse(result.data);
}
