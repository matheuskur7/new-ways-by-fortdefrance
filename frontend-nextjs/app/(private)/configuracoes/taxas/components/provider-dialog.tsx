"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CircleAlert, Layers3, Plus, Store, Trash2 } from "lucide-react"
import { cn } from "cn"
import { AnimatedHeight } from "@/components/ui/animated-height"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EntityTimestamps } from "@/components/entity-timestamps"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from "@/components/ui/dialog"
import { toastManager } from "@/components/ui/toast"
import type { useFeeSettings } from "../hooks/use-fee-settings"
import { applyOrder, nextDisplayOrder } from "../reorder"
import { providerBrands } from "../summary"
import {
  providerFormSchema,
  type FeeBrand,
  type FeeSettings,
  type ProviderForm,
} from "../schemas"
import { BrandForm } from "./brand-form"
import { ProviderDetailsForm } from "./provider-details-form"
import { SortableBrandList } from "./sortable-brand-list"

type View = { kind: "provider" } | { kind: "brand"; brand?: FeeBrand }
type Direction = "forward" | "back"

const detailsFormId = "provider-details-form"

export function ProviderDialog({
  open,
  providerId,
  settings,
  canEdit,
  mutations,
  onProviderCreated,
  onClose,
  onClosed,
}: {
  open: boolean
  /** Ausente ao criar um novo provedor. */
  providerId?: string
  settings: FeeSettings
  canEdit: boolean
  mutations: Omit<ReturnType<typeof useFeeSettings>, "query">
  onProviderCreated: (id: string) => void
  onClose: () => void
  onClosed: () => void
}) {
  const { providerSaving, brandSaving, brandRemoval, reordering } = mutations
  const [view, setView] = useState<View>({ kind: "provider" })
  // Sem direção na abertura: o modal já tem a própria animação de entrada.
  const [direction, setDirection] = useState<Direction | null>(null)
  const [removing, setRemoving] = useState<FeeBrand | null>(null)
  // Ordem arrastada e ainda não salva; null quando segue a ordem do servidor.
  const [order, setOrder] = useState<string[] | null>(null)
  const [brandDirty, setBrandDirty] = useState(false)
  // Saída aguardando confirmação: fechar o modal ou voltar do grupo ao provedor.
  const [discarding, setDiscarding] = useState<"close" | "back" | null>(null)
  const provider = settings.providers.find((item) => item.id === providerId)
  const brands = providerBrands(settings, providerId)
  const orderedBrands = applyOrder(brands, order)
  const orderDirty = orderedBrands.some(
    (brand, index) => brand.id !== brands[index]?.id
  )
  // No modal, e não no formulário, para manter as edições ao abrir um grupo.
  const form = useForm<ProviderForm>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: { name: provider?.name ?? "", logo: provider?.logo ?? "" },
  })
  const detailsDirty = form.formState.isDirty
  const saving = providerSaving.isPending || reordering.isPending
  const pending = saving || brandSaving.isPending || brandRemoval.isPending
  // Fechar descarta tudo o que está pendente, inclusive o grupo aberto.
  const unsaved = detailsDirty || orderDirty || brandDirty
  const creating = view.kind === "brand" ? !view.brand : !provider

  function show(next: View) {
    setDirection(next.kind === "brand" ? "forward" : "back")
    setBrandDirty(false)
    setView(next)
  }

  function close() {
    if (pending) return
    if (unsaved) setDiscarding("close")
    else onClose()
  }

  function back() {
    if (brandDirty) setDiscarding("back")
    else show({ kind: "provider" })
  }

  function discard() {
    const action = discarding
    setDiscarding(null)
    if (action === "close") onClose()
    else show({ kind: "provider" })
  }

  async function save(values: ProviderForm) {
    try {
      const saved =
        !provider || detailsDirty
          ? await providerSaving.mutateAsync({ data: values, id: provider?.id })
          : provider
      form.reset(values)
      if (provider && orderDirty) {
        await reordering.mutateAsync({
          providerId: provider.id,
          brandIds: orderedBrands.map((brand) => brand.id),
        })
        setOrder(null)
      }
      toastManager.add({
        title: provider ? "Alterações salvas" : "Provedor criado",
        type: "success",
      })
      if (!provider) onProviderCreated(saved.id)
    } catch {
      // As mutations exibem o motivo; as edições pendentes continuam no modal.
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close()
      }}
      onOpenChangeComplete={(next) => {
        if (next) return
        setView({ kind: "provider" })
        setDirection(null)
        setRemoving(null)
        setDiscarding(null)
        onClosed()
      }}
    >
      <DialogContent
        showCloseButton={!pending}
        className={cn(
          "max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto",
          view.kind === "brand" || providerId
            ? "sm:max-w-[calc(100%-3rem)] lg:max-w-5xl"
            : "sm:max-w-lg"
        )}
      >
        <AnimatedHeight className="-mx-6 -mb-6">
          <div
            key={
              view.kind === "brand"
                ? `brand-${view.brand?.id ?? "new"}`
                : "provider"
            }
            className={cn(
              "grid gap-6 px-6 pb-6 duration-300 ease-out motion-reduce:animate-none",
              direction && "animate-in fade-in-0",
              direction === "forward" && "slide-in-from-right-8",
              direction === "back" && "slide-in-from-left-8"
            )}
          >
            {view.kind === "brand" && provider ? (
              <BrandForm
                key={view.brand?.id ?? "new"}
                brand={view.brand}
                providerName={provider.name}
                pending={brandSaving.isPending}
                onBack={back}
                onDirtyChange={setBrandDirty}
                onSubmit={(data) =>
                  brandSaving.mutate(
                    {
                      providerId: provider.id,
                      displayOrder:
                        view.brand?.displayOrder ??
                        nextDisplayOrder(
                          brands.map((brand) => brand.displayOrder)
                        ),
                      data,
                      id: view.brand?.id,
                    },
                    { onSuccess: () => show({ kind: "provider" }) }
                  )
                }
              />
            ) : (
              <>
                <DialogHeader icon={Store}>
                  <DialogTitle>
                    {!provider
                      ? "Novo provedor"
                      : canEdit
                        ? "Editar provedor"
                        : provider.name}
                  </DialogTitle>
                  <DialogDescription>
                    {provider
                      ? "Gerencie os dados da maquininha e seus grupos de taxas."
                      : "Cadastre a maquininha. Em seguida, adicione os grupos de taxas."}
                  </DialogDescription>
                </DialogHeader>
                <div
                  className={
                    provider
                      ? "grid gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
                      : "grid"
                  }
                >
                  <ProviderDetailsForm
                    id={detailsFormId}
                    form={form}
                    provider={provider}
                    providers={settings.providers}
                    canEdit={canEdit}
                    pending={saving}
                    onSubmit={(values) => void save(values)}
                  />
                  {provider && (
                    <DialogSection
                      icon={Layers3}
                      title="Grupos de taxas"
                      description="Cada grupo reúne bandeiras com as mesmas taxas por parcela."
                    >
                      {canEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          className="justify-self-start"
                          disabled={pending}
                          onClick={() => show({ kind: "brand" })}
                        >
                          <Plus /> Novo grupo
                        </Button>
                      )}
                      {brands.length ? (
                        <SortableBrandList
                          key={provider.id}
                          brands={orderedBrands}
                          canEdit={canEdit}
                          disabled={pending}
                          onEdit={(brand) => show({ kind: "brand", brand })}
                          onRemove={setRemoving}
                          onReorder={setOrder}
                        />
                      ) : (
                        <p
                          role="status"
                          className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          Nenhum grupo de taxas cadastrado.
                        </p>
                      )}
                    </DialogSection>
                  )}
                </div>
                {provider && (
                  <EntityTimestamps
                    createdAt={provider.createdAt}
                    updatedAt={provider.updatedAt}
                  />
                )}
                {canEdit && (
                  <DialogFooter className="-mx-6 -mb-6 border-t bg-muted/60 px-6 py-4">
                    <Button
                      type="submit"
                      form={detailsFormId}
                      disabled={
                        pending || (!!provider && !detailsDirty && !orderDirty)
                      }
                    >
                      {saving
                        ? "Salvando…"
                        : provider
                          ? "Salvar"
                          : "Criar provedor"}
                    </Button>
                  </DialogFooter>
                )}
              </>
            )}
          </div>
        </AnimatedHeight>
        <ConfirmDialog
          open={discarding !== null}
          icon={CircleAlert}
          tone="warning"
          title={creating ? "Descartar cadastro?" : "Descartar alterações?"}
          description={
            creating
              ? "Os dados preenchidos ainda não foram salvos e serão perdidos."
              : "As alterações feitas ainda não foram salvas e serão perdidas."
          }
          confirmLabel="Descartar"
          cancelLabel="Continuar editando"
          onCancel={() => setDiscarding(null)}
          onConfirm={discard}
        />
        <ConfirmDialog
          open={removing !== null}
          icon={Trash2}
          title="Remover grupo de taxas?"
          description={`O grupo ${removing?.name ?? ""} e todas as suas taxas serão removidos. Esta ação não pode ser desfeita.`}
          confirmLabel="Remover"
          pendingLabel="Removendo…"
          pending={brandRemoval.isPending}
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            if (removing)
              brandRemoval.mutate(removing.id, {
                onSuccess: () => setRemoving(null),
              })
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
