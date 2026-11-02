"use client"

import { useRef, useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"

export type EditorActions = {
  pending: boolean
  onCancel: () => void
  onRemove?: () => Promise<void>
  removalTitle?: string
  removalDescription?: string
}

export function FormActions({
  pending,
  onCancel,
  onRemove,
  removalTitle = "Remover registro?",
  removalDescription,
}: EditorActions) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const [confirmationOpen, setConfirmationOpen] = useState(false)

  async function confirmRemoval() {
    try {
      await onRemove?.()
      setConfirmationOpen(false)
    } catch {
      // A mutation exibe o motivo da falha; mantenha a confirmação aberta.
    }
  }

  return (
    <>
      <DialogFooter className="-mx-6 -mb-6 flex-col border-t bg-muted/60 px-6 py-4 sm:flex-wrap sm:items-center">
        {onRemove && (
          <Button
            type="button"
            variant="destructive"
            className="sm:mr-auto"
            disabled={pending}
            onClick={() => setConfirmationOpen(true)}
          >
            <Trash2 />
            Remover
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </DialogFooter>
      <AlertDialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          if (!pending) setConfirmationOpen(open)
        }}
      >
        <AlertDialogContent initialFocus={cancelRef}>
          <AlertDialogHeader>
            <AlertDialogIcon icon={Trash2} />
            <AlertDialogTitle>{removalTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {removalDescription ?? "Confirme a remoção deste registro."}
            </AlertDialogDescription>
            <p className="mt-1 text-xs font-medium text-destructive">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              ref={cancelRef}
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setConfirmationOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void confirmRemoval()}
            >
              <Trash2 />
              {pending ? "Removendo…" : "Confirmar remoção"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
