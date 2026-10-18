export const SESSION_CHECK_EVENT = "session-check-requested"

export function requestSessionCheck() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_CHECK_EVENT))
  }
}
