"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState, type ReactNode } from "react"
import { getHttpStatus } from "@/lib/api"

// Erros do cliente (exceto timeout e limite de requisições) não mudam ao repetir.
function shouldRetry(failureCount: number, error: unknown) {
  const status = getHttpStatus(error)
  if (
    status &&
    status >= 400 &&
    status < 500 &&
    status !== 408 &&
    status !== 429
  )
    return false
  return failureCount < 1
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: shouldRetry } },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
