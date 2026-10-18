"use client"

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle } from "lucide-react"
import type { AuthSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useUpdateUser } from "../hooks/use-update-user"
import { userSettingsSchema } from "../schemas"
import type { UserSettingsData } from "../schemas"
import { UserImagePicker } from "./user-image-picker"

export function UserSettingsForm({
  user,
  hasActiveOrganization,
}: {
  user: AuthSession["user"]
  hasActiveOrganization: boolean
}) {
  const updateUser = useUpdateUser()
  const [image, setImage] = useState<Blob>()
  const [removeImage, setRemoveImage] = useState(false)
  const form = useForm<UserSettingsData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: { name: user.name },
  })

  function onSubmit(data: UserSettingsData) {
    updateUser.mutate(
      { ...data, image, removeImage },
      {
        onSuccess: () => {
          form.reset(data)
          setImage(undefined)
          setRemoveImage(false)
        },
      }
    )
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      aria-busy={updateUser.isPending}
      className="flex flex-col gap-6"
    >
      <div className="flex items-center gap-4 rounded-xl border bg-muted/40 p-4">
        <UserImagePicker
          key={user.image ?? "no-image"}
          image={user.image}
          disabled={updateUser.isPending || !hasActiveOrganization}
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
      <p
        id="user-image-description"
        className="-mt-3 text-sm text-muted-foreground"
      >
        {hasActiveOrganization
          ? "Altere ou remova sua foto e salve as alterações para atualizar seu perfil."
          : "Selecione uma empresa para alterar sua foto de perfil."}
      </p>
      <FieldGroup className="gap-4">
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="settings-name">Nome completo</FieldLabel>
              <Input
                {...field}
                id="settings-name"
                autoComplete="name"
                disabled={updateUser.isPending}
                aria-invalid={fieldState.invalid}
                className="h-11"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Field>
          <FieldLabel
            htmlFor="settings-email"
            className="flex-wrap items-baseline gap-x-2 gap-y-0"
          >
            E-mail{" "}
            <span
              id="settings-email-description"
              className="text-xs font-normal text-muted-foreground"
            >
              Não pode ser alterado
            </span>
          </FieldLabel>
          <Input
            id="settings-email"
            type="email"
            disabled
            aria-describedby="settings-email-description"
            value={user.email}
            className="h-11"
          />
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        size="lg"
        disabled={
          updateUser.isPending ||
          (!form.formState.isDirty && !image && !removeImage)
        }
        className="w-full"
      >
        {updateUser.isPending && (
          <LoaderCircle
            className="animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}
        {updateUser.isPending ? "Salvando…" : "Salvar alterações"}
      </Button>
    </form>
  )
}
