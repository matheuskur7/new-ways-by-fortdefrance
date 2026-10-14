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
