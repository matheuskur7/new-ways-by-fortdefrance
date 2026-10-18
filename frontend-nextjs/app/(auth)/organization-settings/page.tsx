import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Building2 } from "lucide-react"
import { requireSession } from "@/lib/auth-server"
import { PageHeader } from "@/components/page-header"
import { buttonVariants } from "@/components/ui/button"
import { CompanyDetails } from "./components/company-details"
import { MemberInvitation } from "./components/member-invitation"
import { MembersTable } from "./components/members-table"
import { getManagedOrganization } from "./services/get-managed-organization"

export default async function OrganizationSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    organizationId?: string
  }>
}) {
  const { user } = await requireSession()
  const params = await searchParams
  if (typeof params.organizationId !== "string" || !params.organizationId)
    redirect("/organizations")
  const organization = await getManagedOrganization(params.organizationId)

  return (
    <div
      data-auth-shell="wide"
      data-page-enter
      className="flex animate-in flex-col gap-3 duration-300 fade-in-0 motion-reduce:animate-none"
    >
      <Link
        href="/organizations"
        className={buttonVariants({
          variant: "ghost",
          className: "-ml-2.5 self-start",
        })}
      >
        <ArrowLeft aria-hidden="true" /> Minhas empresas
      </Link>
      <PageHeader
        icon={Building2}
        title="Gerenciamento da Empresa"
        subtitle="Gerencie os dados da empresa e quem faz parte da sua equipe."
      />
      <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)]">
        <CompanyDetails
          key={organization.id}
          organization={organization}
          userId={user.id}
        />
        <MemberInvitation />
      </div>
      <MembersTable
        key={organization.id}
        organizationId={organization.id}
        userId={user.id}
      />
    </div>
  )
}
