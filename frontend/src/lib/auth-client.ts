"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

// /api/auth is proxied to the backend; cookies stay on the frontend origin.
export const authClient = createAuthClient({ plugins: [organizationClient()] });
