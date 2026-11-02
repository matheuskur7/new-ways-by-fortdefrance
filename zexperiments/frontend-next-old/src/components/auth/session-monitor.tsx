"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { checkSessionExpired } from "@/api/auth";
import { authClient } from "@/api/auth-client";
import {
  isSigningOut,
  SESSION_EXPIRED_EVENT,
  SESSION_EXPIRED_MESSAGE,
} from "@/api/session";

// Mounted only after the server has validated an authenticated session.
export function SessionMonitor() {
  const { data, isPending, isRefetching, error } = authClient.useSession();
  const router = useRouter();
  const client = useQueryClient();
  const handled = useRef(false);

  useEffect(() => {
    let active = true;
    let checking = false;
    async function expire() {
      if (handled.current || isSigningOut() || checking) return;
      checking = true;
      try {
        const expired = await checkSessionExpired();
        if (!active || handled.current || isSigningOut() || !expired) return;
        handled.current = true;
        toast.warn(SESSION_EXPIRED_MESSAGE, { toastId: SESSION_EXPIRED_EVENT });
        await client.cancelQueries();
        client.clear();
        router.replace("/login");
        router.refresh();
      } finally {
        checking = false;
      }
    }

    function requestCheck() {
      void expire();
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, requestCheck);
    if (
      !isPending &&
      !isRefetching &&
      !data &&
      (!error || error.status === 401)
    )
      requestCheck();
    return () => {
      active = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, requestCheck);
    };
  }, [client, data, error, isPending, isRefetching, router]);

  return null;
}
