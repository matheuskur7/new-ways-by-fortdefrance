import type { ReactNode } from "react"
import { requireActiveOrganization } from "./services/require-active-organization"

export default async function SystemSettingsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireActiveOrganization()
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-3">
      {children}
    </section>
  )
}
