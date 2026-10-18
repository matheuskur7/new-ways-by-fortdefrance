import { z } from "zod"
import { getBackendUrl } from "@/lib/backend-url"

const downloadSchema = z.object({ url: z.url() })

// Redireciona o navegador ao S3 sem transportar os bytes pelo frontend/backend.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const headers = { "Cache-Control": "private, no-store" }
  const parsed = z.uuid().safeParse((await params).id)
  if (!parsed.success) return new Response(null, { status: 404, headers })
  const cookie = request.headers.get("cookie")
  if (!cookie) return new Response(null, { status: 401, headers })
  try {
    const response = await fetch(
      `${getBackendUrl()}/user-images/${parsed.data}/download-url`,
      {
        headers: { cookie },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }
    )
    if (!response.ok)
      return new Response(null, { status: response.status, headers })
    const { url } = downloadSchema.parse(await response.json())
    const target = new URL(url)
    if (target.protocol !== "https:" && target.protocol !== "http:")
      return new Response(null, { status: 502, headers })
    return new Response(null, {
      status: 302,
      headers: { ...headers, Location: url },
    })
  } catch {
    return new Response(null, { status: 502, headers })
  }
}
