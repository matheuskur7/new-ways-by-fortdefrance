"use client"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { ProviderEditor } from "./provider-editor"
import { GroupEditor } from "./group-editor"
import type { FeeEditor, ManagedProvider } from "../management-schemas"
import type { useFeeManagement } from "../hooks/use-fee-management"

export function FeeEditorDialog({
  editor,
  open,
  providers,
  selectedId,
  mutation,
  removal,
  onClose,
  onClosed,
  onSelect,
}: {
  editor: FeeEditor | null
  open: boolean
  providers: ManagedProvider[]
  selectedId: string
  mutation: ReturnType<typeof useFeeManagement>["mutation"]
  removal: ReturnType<typeof useFeeManagement>["removal"]
  onClose: () => void
  onClosed: () => void
  onSelect: (id: string) => void
}) {
  const pending = mutation.isPending || removal.isPending
  const actions = { pending, onCancel: onClose }

  async function remove(kind: "provider" | "group", id: string) {
    await removal.mutateAsync({ kind, id })
    if (kind === "provider") onSelect("")
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
      onOpenChangeComplete={(open) => {
        if (!open) onClosed()
      }}
    >
      <DialogContent
        showCloseButton={!pending}
        className={
          editor?.kind === "group"
            ? "max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[calc(100%-3rem)] lg:max-w-6xl"
            : "max-h-[90dvh] overflow-y-auto sm:max-w-md"
        }
      >
        {editor?.kind === "provider" && (
          <ProviderEditor
            {...actions}
            provider={editor.provider}
            onRemove={
              editor.provider
                ? () => remove("provider", editor.provider!.id)
                : undefined
            }
            providers={providers}
            onSave={(data) =>
              mutation.mutate(
                { kind: "provider", data, id: editor.provider?.id },
                {
                  onSuccess: (result) => {
                    onSelect(result.id)
                    onClose()
                  },
                }
              )
            }
          />
        )}
        {editor?.kind === "group" && (
          <GroupEditor
            {...actions}
            group={editor.group}
            onRemove={
              editor.group ? () => remove("group", editor.group!.id) : undefined
            }
            providers={providers}
            selectedId={selectedId}
            onSave={(data) =>
              mutation.mutate(
                { kind: "group", data, id: editor.group?.id },
                {
                  onSuccess: () => {
                    onSelect(data.providerId)
                    onClose()
                  },
                }
              )
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
