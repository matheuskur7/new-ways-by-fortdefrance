"use client"

import { useRef, useState } from "react"
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

type Content = {
  icon: LucideIcon
  tone: AlertDialogTone
  title: string
  description: string
  confirmLabel: string
  pendingLabel: string
  cancelLabel: string
  blockedReason?: string
}

function sameContent(a: Content, b: Content) {
  return (Object.keys(a) as (keyof Content)[]).every((key) =>
    Object.is(a[key], b[key])
  )
}

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
  description: string
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
  const current: Content = {
    icon,
    tone,
    title,
    description,
    confirmLabel,
    pendingLabel,
    cancelLabel,
    blockedReason,
  }
  // Quem usa costuma limpar os dados ao fechar; mantém o último conteúdo
  // aberto durante a animação de saída para o modal não trocar de aparência.
  const [lastOpen, setLastOpen] = useState(current)
  if (open && !sameContent(lastOpen, current)) setLastOpen(current)
  const view = open ? current : lastOpen

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onCancel()
      }}
    >
      <AlertDialogContent initialFocus={cancelRef}>
        <AlertDialogHeader>
          {view.blockedReason ? (
            <AlertDialogIcon icon={Info} tone="info" />
          ) : (
            <AlertDialogIcon icon={view.icon} tone={view.tone} />
          )}
          <AlertDialogTitle>{view.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {view.blockedReason ?? view.description}
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
            {view.blockedReason ? "Entendi" : view.cancelLabel}
          </Button>
          {!view.blockedReason && (
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? view.pendingLabel : view.confirmLabel}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
