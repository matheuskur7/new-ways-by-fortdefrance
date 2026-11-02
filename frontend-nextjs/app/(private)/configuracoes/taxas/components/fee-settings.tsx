"use client"

import { useState } from "react"
import { CreditCard, Plus, Store, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/ui/section-card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFeeSettings } from "../hooks/use-fee-settings"
import type { FeeProvider } from "../schemas"
import { ProviderCard } from "./provider-card"
import { SettingsOverview } from "./settings-overview"
import { providerBrands } from "../summary"
import { ProviderDialog } from "./provider-dialog"

type Editing = { providerId?: string }

export function FeeSettings({
  userId,
  organizationId,
  canEdit,
}: {
  userId: string
  organizationId: string
  canEdit: boolean
}) {
  const { query, ...mutations } = useFeeSettings(userId, organizationId)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [removing, setRemoving] = useState<FeeProvider | null>(null)
  const settings = query.data
  const brandsOf = (providerId: string) =>
    settings ? providerBrands(settings, providerId) : []

  function openDialog(providerId?: string) {
    setEditing({ providerId })
    setDialogOpen(true)
  }

  return (
    <section className="flex flex-1 flex-col gap-3">
      <PageHeader
        icon={CreditCard}
        title="Configurações de Taxas"
        subtitle="Gerencie as maquininhas e os grupos de taxas da empresa ativa."
      />
      {!query.isError && <SettingsOverview settings={settings} />}
      <SectionCard
        className="flex-1"
        icon={Store}
        title="Provedores de maquininha"
        description={
          canEdit
            ? "Clique em um provedor para editar seus dados e grupos de taxas."
            : "Somente proprietários e administradores podem alterar as taxas."
        }
        action={
          canEdit && (
            <Button disabled={!settings} onClick={() => openDialog()}>
              <Plus /> Adicionar provedor
            </Button>
          )
        }
      >
        {query.isPending ? (
          <div
            role="status"
            aria-label="Carregando provedores"
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-56 w-full rounded-lg" />
            ))}
          </div>
        ) : query.isError ? (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 text-sm text-destructive"
          >
            Não foi possível carregar as taxas.
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : !query.data.providers.length ? (
          <div className="grid justify-items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
            <CreditCard
              className="size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-semibold">Nenhum provedor cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Adicione uma maquininha para cadastrar seus grupos de taxas.
            </p>
          </div>
        ) : (
          <ul
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Provedores de maquininha"
          >
            {query.data.providers.map((provider) => (
              <li key={provider.id} className="min-w-0">
                <ProviderCard
                  provider={provider}
                  brands={brandsOf(provider.id)}
                  canEdit={canEdit}
                  onOpen={() => openDialog(provider.id)}
                  onRemove={() => setRemoving(provider)}
                />
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
      {settings && editing && (
        <ProviderDialog
          open={dialogOpen}
          providerId={editing.providerId}
          settings={settings}
          canEdit={canEdit}
          mutations={mutations}
          onProviderCreated={(providerId) => setEditing({ providerId })}
          onClose={() => setDialogOpen(false)}
          onClosed={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        icon={Trash2}
        title="Remover provedor?"
        description={`O provedor ${removing?.name ?? ""} será removido. Esta ação não pode ser desfeita.`}
        confirmLabel="Remover"
        pendingLabel="Removendo…"
        blockedReason={
          removing && brandsOf(removing.id).length
            ? `Remova os grupos de taxas de ${removing.name} antes de removê-lo.`
            : undefined
        }
        pending={mutations.providerRemoval.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => {
          if (removing)
            mutations.providerRemoval.mutate(removing.id, {
              onSuccess: () => setRemoving(null),
            })
        }}
      />
    </section>
  )
}
