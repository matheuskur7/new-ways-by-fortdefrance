"use client";

export const SESSION_EXPIRED_EVENT = "session-expired";
export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Entre novamente.";

let signingOut = false;

export function setSigningOut(value: boolean) {
  signingOut = value;
}

export function isSigningOut() {
  return signingOut;
}

export function notifySessionExpired() {
  if (!signingOut && typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

// A cached null or a late 401 is only a signal to recheck, never proof of expiry.
export async function confirmSessionExpired(
  check: () => Promise<{
    data: unknown;
    error: { status: number } | null;
  }>,
): Promise<boolean> {
  if (signingOut) return false;
  try {
    const result = await check();
    if (signingOut) return false;
    return result.error ? result.error.status === 401 : result.data === null;
  } catch {
    // Network/server failures must not log out an authenticated user.
    return false;
  }
}
