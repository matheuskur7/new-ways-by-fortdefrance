"use client"

import { useState } from "react"
import { CircleAlert, UserRoundCog } from "lucide-react"
import type { AuthSession } from "@/lib/session"
import { ConfirmDialog } from "@/components/confirm-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUpdateUser } from "./use-update-user"
import { UserSettingsForm } from "./user-settings-form"

/**
 * Modal dos ajustes do usuário, aberto tanto pela seleção de empresas quanto
 * pelo menu do perfil na sidebar. O conteúdo é montado a cada abertura, então
 * o formulário sempre parte dos dados atuais da sessão.
 */
export function UserSettingsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AuthSession["user"]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateUser = useUpdateUser()
  const [unsaved, setUnsaved] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const pending = updateUser.isPending

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
        className="max-h-[calc(100dvh-2rem)] overflow-x-hidden overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader icon={UserRoundCog}>
          <DialogTitle>Ajustes do usuário</DialogTitle>
          <DialogDescription>
            Seus dados pessoais e informações da conta.
          </DialogDescription>
        </DialogHeader>
        <UserSettingsForm
          user={user}
          updateUser={updateUser}
          onDirtyChange={setUnsaved}
          onSaved={() => onOpenChange(false)}
        />
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
