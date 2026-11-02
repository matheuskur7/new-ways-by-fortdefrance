"use client"

import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { UserImage } from "@/components/user-image"
import { DataTable } from "@/components/data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogSection,
} from "@/components/ui/dialog"
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  UserCog,
  UsersRound,
} from "lucide-react"
import { MemberRoleSelect, type MemberRole } from "./member-role-select"
import { useOrganizationMembers } from "../hooks/use-organization-members"
import { useUpdateMemberRole } from "../hooks/use-update-member-role"
import { MEMBERS_PAGE_SIZE } from "../services/list-organization-members"
import { isOrganizationOwner, type OrganizationMember } from "../schemas"

const getMemberId = (member: OrganizationMember) => member.id

export function MembersTable({
  organizationId,
  userId,
}: {
  organizationId: string
  userId: string
}) {
  const [pageIndex, setPageIndex] = useState(0)
  const query = useOrganizationMembers(userId, organizationId, pageIndex)
  const update = useUpdateMemberRole(userId, organizationId)
  const members = query.data?.members ?? []
  const total = query.data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / MEMBERS_PAGE_SIZE))
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [pendingChange, setPendingChange] = useState<{
    memberId: string
    name: string
    role: MemberRole
  } | null>(null)

  const columns = useMemo<ColumnDef<OrganizationMember>[]>(
    () => [
      {
        id: "name",
        accessorFn: (member) => member.user.name,
        header: "Membro",
        cell: ({ row: { original: member } }) => (
          <div className="flex items-center gap-3 font-medium">
            <span
              className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40 text-xs font-semibold text-muted-foreground"
              aria-hidden="true"
            >
              <UserImage
                src={member.userId === userId ? member.user.image : null}
                size={32}
                fallback={
                  <span>
                    {member.user.name
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((name) => name[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                }
              />
            </span>
            <span>{member.user.name}</span>
          </div>
        ),
      },
      {
        id: "email",
        accessorFn: (member) => member.user.email,
        header: "E-mail",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.user.email}
          </span>
        ),
      },
      {
        accessorKey: "role",
        header: "Cargo",
        cell: ({ row: { original: member } }) =>
          isOrganizationOwner(member.role) ? (
            <Badge variant="neutral" size="md" className="h-9 w-40">
              Proprietário
            </Badge>
          ) : member.role === "admin" || member.role === "member" ? (
            <MemberRoleSelect
              value={member.role}
              disabled={update.isPending}
              label={`Cargo de ${member.user.name}`}
              onChange={(role) => {
                if (role === member.role) return
                setPendingChange({
                  memberId: member.id,
                  name: member.user.name,
                  role,
                })
                setConfirmationOpen(true)
              }}
            />
          ) : (
            <span className="text-muted-foreground">{member.role}</span>
          ),
      },
    ],
    [update.isPending, userId]
  )

  function confirmRoleChange() {
    if (!pendingChange) return
    update.mutate(
      { memberId: pendingChange.memberId, role: pendingChange.role },
      { onSuccess: () => setConfirmationOpen(false) }
    )
  }
  return (
    <>
      <DialogSection
        icon={UsersRound}
        title="Membros da empresa"
        description="Quem faz parte da equipe e seus cargos."
        action={
          <Badge>
            {query.isPending
              ? "Carregando…"
              : `${total} ${total === 1 ? "membro" : "membros"}`}
          </Badge>
        }
      >
        {query.isPending ? (
          <p
            role="status"
            className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
          >
            <LoaderCircle
              className="size-4 animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Carregando membros…
          </p>
        ) : query.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="alert" className="text-sm text-muted-foreground">
              Não foi possível carregar os membros.
            </p>
            <Button
              variant="outline"
              onClick={() => query.refetch()}
              disabled={query.isFetching}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            columnClassNames={{ role: "w-px" }}
            cellClassNames={{ role: "text-right [&>button]:ml-auto" }}
            data={members}
            getRowId={getMemberId}
            caption="Membros e cargos da empresa"
            maxVisibleRows={3.5}
          />
        )}
        {total > MEMBERS_PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Página {pageIndex + 1} de {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={
                  pageIndex === 0 || query.isFetching || update.isPending
                }
                onClick={() => setPageIndex((current) => current - 1)}
              >
                <ChevronLeft aria-hidden="true" /> Anterior
              </Button>
              <Button
                variant="outline"
                disabled={
                  pageIndex + 1 >= pageCount ||
                  query.isFetching ||
                  update.isPending
                }
                onClick={() => setPageIndex((current) => current + 1)}
              >
                Próxima <ChevronRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </DialogSection>
      <Dialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          if (!update.isPending) setConfirmationOpen(open)
        }}
        onOpenChangeComplete={(open) => {
          if (!open) setPendingChange(null)
        }}
      >
        <DialogContent showCloseButton={!update.isPending}>
          <DialogHeader icon={UserCog}>
            <DialogTitle>Alterar cargo do membro?</DialogTitle>
            <DialogDescription>
              Confirme a alteração do cargo de{" "}
              <strong className="font-medium text-foreground">
                {pendingChange?.name}
              </strong>{" "}
              para{" "}
              <strong className="font-medium text-foreground">
                {pendingChange?.role === "admin" ? "Administrador" : "Membro"}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={update.isPending}
              onClick={() => setConfirmationOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmRoleChange}
              disabled={update.isPending}
            >
              {update.isPending && (
                <LoaderCircle
                  className="animate-spin motion-reduce:animate-none"
                  aria-hidden="true"
                />
              )}
              {update.isPending ? "Salvando…" : "Confirmar alteração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
