"use client"

import { useState } from "react"
import { CreditCard, Layers3, Pencil, Plus } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useFeeManagement } from "../hooks/use-fee-management"
import type { FeeEditor } from "../management-schemas"
import { ProviderList } from "./provider-list"
import { SortableFeeGroups } from "./sortable-fee-groups"
import { FeeEditorDialog } from "./fee-editor-dialog"

export function FeeManagement({
  organizationId,
  userId,
  canEdit,
}: {
  organizationId: string
  userId: string
  canEdit: boolean
}) {
  const { query, mutation, removal, reordering } = useFeeManagement(
    userId,
    organizationId
  )
  const [selectedId, setSelectedId] = useState("")
  const [editor, setEditor] = useState<FeeEditor | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const providers = query.data?.providers ?? []
  const selected =
    providers.find((provider) => provider.id === selectedId) ?? providers[0]
  const groups = (query.data?.groups ?? []).filter(
    (group) => group.providerId === selected?.id
  )
  function openEditor(value: FeeEditor) {
    setEditor(value)
    setEditorOpen(true)
  }

  return (
    <section className="grid gap-4">
      <PageHeader
        icon={CreditCard}
        title="Configurações de Taxas"
        subtitle="Gerencie provedores, grupos e taxas de pagamento da empresa ativa."
      />
      {query.isPending ? (
        <Skeleton
          className="h-64 w-full"
          aria-label="Carregando taxas"
          role="status"
        />
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
      ) : (
        <>
          <Card size="sm">
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid min-w-0 gap-2">
                <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Provedores de taxas
                </h2>
                <ProviderList
                  providers={providers}
                  selectedId={selected?.id ?? ""}
                  onSelect={setSelectedId}
                />
              </div>
              {canEdit && (
                <Button
                  variant="outline"
                  className="self-start sm:self-center"
                  onClick={() => openEditor({ kind: "provider" })}
                >
                  <Plus /> Novo provedor
                </Button>
              )}
            </CardContent>
          </Card>
          {!canEdit && (
            <p className="text-sm text-muted-foreground">
              Somente proprietários e administradores podem alterar as taxas.
            </p>
          )}
          {!selected ? (
            <Card>
              <CardContent className="grid justify-items-center gap-3 py-12 text-center">
                <CreditCard className="size-10 text-muted-foreground" />
                <h2 className="font-semibold">Nenhum provedor cadastrado</h2>
                <p className="text-sm text-muted-foreground">
                  Cadastre um provedor para organizar os grupos e suas taxas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid min-w-0 gap-0 overflow-hidden rounded-xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Layers3
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <h2 className="text-base font-semibold wrap-break-word">
                      {selected.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Grupos e opções de pagamento
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
                    {groups.length} grupos
                  </span>
                </div>
                {canEdit && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        openEditor({ kind: "provider", provider: selected })
                      }
                    >
                      <Pencil /> Editar provedor
                    </Button>
                    <Button onClick={() => openEditor({ kind: "group" })}>
                      <Plus /> Novo grupo
                    </Button>
                  </div>
                )}
              </div>
              {!groups.length ? (
                <p
                  role="status"
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  Nenhum grupo neste provedor.
                </p>
              ) : (
                <SortableFeeGroups
                  key={selected.id}
                  groups={groups}
                  canEdit={canEdit}
                  disabled={reordering.isPending || editorOpen}
                  onEdit={(group) => openEditor({ kind: "group", group })}
                  onReorder={(groupIds) =>
                    reordering.mutateAsync({
                      providerId: selected.id,
                      groupIds,
                    })
                  }
                />
              )}
            </div>
          )}
        </>
      )}
      <FeeEditorDialog
        editor={editor}
        open={editorOpen}
        providers={providers}
        selectedId={selected?.id ?? ""}
        mutation={mutation}
        removal={removal}
        onClose={() => setEditorOpen(false)}
        onClosed={() => setEditor(null)}
        onSelect={setSelectedId}
      />
    </section>
  )
}
