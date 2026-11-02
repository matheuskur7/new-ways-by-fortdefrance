"use client"

import { useRef, type ReactNode } from "react"
import { Info, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogIcon,
  AlertDialogTitle,
  type AlertDialogTone,
} from "@/components/ui/alert-dialog"

/**
 * Confirmação de ações destrutivas, como remover uma entidade ou descartar
 * edições não salvas. O foco inicial fica em cancelar. Com `blockedReason`,
 * vira um aviso informativo, sem a ação de confirmar.
 */
export function ConfirmDialog({
  open,
  icon,
  tone = "destructive",
  title,
  description,
  confirmLabel,
  pendingLabel = confirmLabel,
  cancelLabel = "Cancelar",
  pending = false,
  blockedReason,
  onCancel,
  onConfirm,
}: {
  open: boolean
  icon: LucideIcon
  /** Cor do ícone: `warning` para atenção e `destructive` para exclusão. */
  tone?: AlertDialogTone
  title: string
  description: ReactNode
  confirmLabel: string
  /** Texto do botão de confirmar enquanto a ação está em andamento. */
  pendingLabel?: string
  cancelLabel?: string
  pending?: boolean
  /** Quando informado, explica por que a ação não está disponível e oculta a confirmação. */
  blockedReason?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onCancel()
      }}
    >
      <AlertDialogContent initialFocus={cancelRef}>
        <AlertDialogHeader>
          {blockedReason ? (
            <AlertDialogIcon icon={Info} tone="info" />
          ) : (
            <AlertDialogIcon icon={icon} tone={tone} />
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {blockedReason ?? description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            {blockedReason ? "Entendi" : cancelLabel}
          </Button>
          {!blockedReason && (
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? pendingLabel : confirmLabel}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
