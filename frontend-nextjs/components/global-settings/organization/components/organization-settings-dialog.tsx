"use client"

import { useState } from "react"
import { isAxiosError } from "axios"
import { Building2, CircleAlert, LoaderCircle, Save } from "lucide-react"
import type { Organization } from "@/app/(auth)/empresas/schemas"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { AnimatedHeight } from "@/components/ui/animated-height"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CompanyDetailsForm } from "./company-details-form"
import { MemberInvitation } from "./member-invitation"
import { MembersTable } from "./members-table"
import { useOrganization } from "../hooks/use-organization"
import { useUpdateOrganization } from "../hooks/use-update-organization"

const FORM_ID = "organization-settings-details"

/**
 * Modal de gerenciamento da empresa, aberto pela seleção de empresas para
 * proprietários e administradores. O conteúdo é montado a cada abertura e
 * busca os dados atuais da empresa.
 */
export function OrganizationSettingsDialog({
  organization,
  userId,
  open,
  onOpenChange,
}: {
  organization: Organization
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateOrganization(userId, organization.id)
  const [unsaved, setUnsaved] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const pending = update.isPending

  function close() {
    if (pending) return
    if (unsaved) setDiscarding(true)
    else onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true)
        else close()
      }}
      onOpenChangeComplete={(next) => {
        if (next) return
        setUnsaved(false)
        setDiscarding(false)
      }}
    >
      <DialogContent
        showCloseButton={!pending}
        className="max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-3xl lg:max-w-5xl"
      >
        <DialogHeader icon={Building2}>
          <DialogTitle>Gerenciamento da Empresa</DialogTitle>
          <DialogDescription>
            Gerencie os dados de {organization.name} e quem faz parte da sua
            equipe.
          </DialogDescription>
        </DialogHeader>
        <AnimatedHeight>
          <OrganizationSettingsContent
            organizationId={organization.id}
            userId={userId}
            update={update}
            onDirtyChange={setUnsaved}
            onSaved={() => onOpenChange(false)}
          />
        </AnimatedHeight>
        <DialogFooter className="-mx-6 -mb-6 border-t bg-muted/60 px-6 py-4">
          <Button form={FORM_ID} type="submit" disabled={pending || !unsaved}>
            {pending ? (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            ) : (
              <Save aria-hidden="true" />
            )}
            {pending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </DialogFooter>
        <ConfirmDialog
          open={discarding}
          icon={CircleAlert}
          tone="warning"
          title="Descartar alterações?"
          description="As alterações feitas ainda não foram salvas e serão perdidas."
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          onCancel={() => setDiscarding(false)}
          onConfirm={() => {
            setDiscarding(false)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function OrganizationSettingsContent({
  organizationId,
  userId,
  update,
  onDirtyChange,
  onSaved,
}: {
  organizationId: string
  userId: string
  update: ReturnType<typeof useUpdateOrganization>
  onDirtyChange: (dirty: boolean) => void
  onSaved: () => void
}) {
  const query = useOrganization(userId, organizationId)

  if (query.isPending)
    return (
      <p
        role="status"
        className="flex items-center gap-2 py-6 text-sm text-muted-foreground"
      >
        <LoaderCircle
          className="size-4 animate-spin motion-reduce:animate-none"
          aria-hidden="true"
        />
        Carregando dados da empresa…
      </p>
    )

  if (query.isError) {
    const status = isAxiosError(query.error)
      ? query.error.response?.status
      : undefined
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="alert" className="text-sm text-muted-foreground">
          {status === 403 || status === 404
            ? "Você não tem mais acesso ao gerenciamento desta empresa."
            : "Não foi possível carregar os dados da empresa."}
        </p>
        {status !== 403 && status !== 404 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            Tentar novamente
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.65fr)]">
        <CompanyDetailsForm
          id={FORM_ID}
          organization={query.data}
          update={update}
          onDirtyChange={onDirtyChange}
          onSaved={onSaved}
        />
        <MemberInvitation />
      </div>
      <MembersTable organizationId={organizationId} userId={userId} />
    </div>
  )
}
