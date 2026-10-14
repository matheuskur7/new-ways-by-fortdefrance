"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { SESSION_EXPIRED_EVENT, SESSION_EXPIRED_MESSAGE } from "@/api/session";

export function SessionExpiredToast() {
  const router = useRouter();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("reason") !== "session-expired") return;
    toast.warn(SESSION_EXPIRED_MESSAGE, { toastId: SESSION_EXPIRED_EVENT });
    router.replace("/login");
  }, [router]);

  return null;
}
