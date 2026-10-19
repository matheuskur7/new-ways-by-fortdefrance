"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle, Save, UserRound } from "lucide-react"
import type { AuthSession } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
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

export function UserSettingsForm({ user }: { user: AuthSession["user"] }) {
  const updateUser = useUpdateUser()
  const [image, setImage] = useState<Blob>()
  const [removeImage, setRemoveImage] = useState(false)
  const form = useForm<UserSettingsData>({
    resolver: zodResolver(userSettingsSchema),
    defaultValues: { name: user.name },
  })

  const { errors, isDirty } = form.formState

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
      className="flex flex-col gap-3"
    >
      <Card size="sm" className="gap-3 ring-0">
        <CardHeader>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <UserRound
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Dados pessoais
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <UserImagePicker
              key={user.image ?? "no-image"}
              image={user.image}
              disabled={updateUser.isPending}
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
              <FieldLabel htmlFor="settings-name">Nome completo</FieldLabel>
              <Input
                {...form.register("name")}
                id="settings-name"
                autoComplete="off"
                disabled={updateUser.isPending}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <FieldError errors={[errors.name]} />}
            </Field>
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
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            type="submit"
            disabled={
              updateUser.isPending || (!isDirty && !image && !removeImage)
            }
          >
            {updateUser.isPending && (
              <LoaderCircle
                className="animate-spin motion-reduce:animate-none"
                aria-hidden="true"
              />
            )}
            {!updateUser.isPending && <Save aria-hidden="true" />}
            {updateUser.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
