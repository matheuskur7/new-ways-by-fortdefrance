"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { notifySessionExpired } from "./session";

// /api/auth is proxied to the backend; cookies stay on the frontend origin.
export const authClient = createAuthClient({
  plugins: [organizationClient()],
  sessionOptions: { refetchInterval: 60 },
  fetchOptions: {
    onError: ({ error }) => {
      if (error.status === 401) notifySessionExpired();
    },
  },
});
