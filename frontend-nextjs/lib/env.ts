import { z } from "zod"

const optionalHttpUrl = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value
    return value.trim() || undefined
  },
  z.url({ protocol: /^https?$/ }).optional()
)

export const envSchema = z
  .object({
    API_URL: optionalHttpUrl,
    NEXT_PUBLIC_API_URL: optionalHttpUrl,
  })
  .transform(({ API_URL, NEXT_PUBLIC_API_URL }) => ({
    API_URL: (
      API_URL ??
      NEXT_PUBLIC_API_URL ??
      "http://localhost:5000"
    ).replace(/\/+$/, ""),
  }))

export type Environment = z.infer<typeof envSchema>

// Consumido apenas no servidor Next.js e em next.config.ts.
export const env: Environment = envSchema.parse({
  API_URL: process.env.API_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
})
