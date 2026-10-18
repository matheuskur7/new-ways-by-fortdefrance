import { requireSession } from "@/lib/auth-server"

export default async function Page() {
  await requireSession()
  return <div>home</div>
}
