import type { NextConfig } from "next"
import { getBackendUrl } from "./lib/backend-url"

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
  },
  async rewrites() {
    return [
      { source: "/backend/:path*", destination: `${getBackendUrl()}/:path*` },
    ]
  },
}

export default nextConfig
