"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { authClient } from "@/api/auth-client";
import { isSigningOut, SESSION_EXPIRED_EVENT, SESSION_EXPIRED_MESSAGE } from "@/api/session";

// Mounted only after the server has validated an authenticated session.
export function SessionMonitor() {
  const { data, isPending, error } = authClient.useSession();
  const router = useRouter();
  const client = useQueryClient();
  const handled = useRef(false);

  useEffect(() => {
    function expire() {
      if (handled.current || isSigningOut()) return;
      handled.current = true;
      toast.warn(SESSION_EXPIRED_MESSAGE, { toastId: SESSION_EXPIRED_EVENT });
      void client.cancelQueries().then(() => client.clear());
      router.replace("/login");
      router.refresh();
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    if (!isPending && !data && (!error || error.status === 401)) expire();
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
  }, [client, data, error, isPending, router]);

  return null;
}
