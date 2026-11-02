import type { ReactNode } from "react"
import { requireActiveOrganization } from "./services/require-active-organization"

export default async function SystemSettingsLayout({
  children,
}: {
  children: ReactNode
}) {
  await requireActiveOrganization()
  return (
    <section className="flex w-full min-w-0 flex-col gap-3">{children}</section>
  )
}
