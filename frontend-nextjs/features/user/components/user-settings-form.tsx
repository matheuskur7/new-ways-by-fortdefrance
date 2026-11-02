"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle, Save, UserRound } from "lucide-react"
import type { AuthSession } from "@/lib/session"
import { EntityTimestamps } from "@/components/entity-timestamps"
import { Button } from "@/components/ui/button"
import { DialogFooter, DialogSection } from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { useUpdateUser } from "../hooks/use-update-user"
import { userSettingsSchema } from "../schemas"
import type { UserSettingsData } from "../schemas"
import { UserImagePicker } from "./user-image-picker"

/**
 * Campos dos ajustes do usuário. A mutation pertence ao modal, que bloqueia o
 * fechamento enquanto o envio está em andamento.
 */
export function UserSettingsForm({
  user,
  updateUser,
  onDirtyChange,
  onSaved,
}: {
  user: AuthSession["user"]
  updateUser: ReturnType<typeof useUpdateUser>
  /** Informa se há edições não salvas, para confirmar o fechamento do modal. */
  onDirtyChange: (dirty: boolean) => void
  onSaved: () => void
}) {
  const [image, setImage] = useState<Blob>()
  const [removeImage, setRemoveImage] = useState(false)
  const form = useForm<UserSettingsData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: { name: user.name },
  })

  const { errors, isDirty } = form.formState
  const pending = updateUser.isPending
  const unsaved = isDirty || !!image || removeImage

  useEffect(() => onDirtyChange(unsaved), [unsaved, onDirtyChange])

  function onSubmit(data: UserSettingsData) {
    updateUser.mutate(
      { ...data, image, removeImage },
      {
        onSuccess: () => {
          form.reset(data)
          setImage(undefined)
          setRemoveImage(false)
          onSaved()
        },
      }
    )
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      aria-busy={pending}
      className="grid gap-6"
    >
      <DialogSection
        icon={UserRound}
        title="Dados pessoais"
        description="Foto e nome exibidos no sistema."
      >
        <div className="flex items-center gap-4">
          <UserImagePicker
            image={user.image}
            disabled={pending}
            onChange={(blob) => {
              setImage(blob)
              setRemoveImage(false)
            }}
            onRemove={() => {
              setImage(undefined)
              setRemoveImage(Boolean(user.image))
            }}
          />
          <div className="min-w-0">
            <p className="font-semibold wrap-break-word">{user.name}</p>
            <p className="text-sm break-all text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
        <FieldGroup className="gap-3">
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="user-settings-name">Nome completo</FieldLabel>
            <Input
              {...form.register("name")}
              id="user-settings-name"
              autoComplete="name"
              disabled={pending}
              aria-invalid={Boolean(errors.name)}
              aria-describedby="user-settings-name-error"
            />
            <FieldError id="user-settings-name-error" errors={[errors.name]} />
          </Field>
          <Field>
            <FieldLabel
              htmlFor="user-settings-email"
              className="flex-wrap items-baseline gap-x-2 gap-y-0"
            >
              E-mail{" "}
              <span
                id="user-settings-email-description"
                className="text-xs font-normal text-muted-foreground"
              >
                Não pode ser alterado
              </span>
            </FieldLabel>
            <Input
              id="user-settings-email"
              type="email"
              disabled
              aria-describedby="user-settings-email-description"
              value={user.email}
            />
          </Field>
        </FieldGroup>
      </DialogSection>
      <EntityTimestamps createdAt={user.createdAt} updatedAt={user.updatedAt} />
      <DialogFooter className="-mx-6 -mb-6 border-t bg-muted/60 px-6 py-4">
        <Button type="submit" disabled={pending || !unsaved}>
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
    </form>
  )
}
