"use client"

import { Controller, type UseFormReturn } from "react-hook-form"
import { Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { DialogSection } from "@/components/ui/dialog"
import { LogoField } from "./logo-field"
import type { FeeProvider, ProviderForm } from "../schemas"

/**
 * Campos do provedor. O formulário pertence ao modal, que o envia pelo botão
 * do rodapé (atributo `form`) junto com a ordem dos grupos.
 */
export function ProviderDetailsForm({
  id,
  form,
  provider,
  providers,
  canEdit,
  pending,
  onSubmit,
}: {
  id: string
  form: UseFormReturn<ProviderForm>
  provider?: FeeProvider
  providers: FeeProvider[]
  canEdit: boolean
  pending: boolean
  onSubmit: (values: ProviderForm) => void
}) {
  const { errors } = form.formState

  return (
    <form
      id={id}
      className="h-full"
      aria-busy={pending}
      onSubmit={form.handleSubmit((values) => {
        const name = values.name.trim().toLocaleLowerCase("pt-BR")
        if (
          providers.some(
            (item) =>
              item.id !== provider?.id &&
              item.name.toLocaleLowerCase("pt-BR") === name
          )
        ) {
          form.setError("name", {
            message: "Já existe um provedor com este nome.",
          })
          return
        }
        onSubmit(values)
      })}
    >
      <DialogSection
        className="h-full"
        icon={Building2}
        title="Dados do provedor"
        description="Nome e logotipo exibidos na calculadora de taxas."
      >
        <fieldset disabled={pending || !canEdit} className="grid gap-4">
          <Field>
            <FieldLabel htmlFor="provider-name">Nome</FieldLabel>
            <Input
              id="provider-name"
              placeholder="Ex.: InfinitePay"
              aria-invalid={!!errors.name}
              aria-describedby="provider-name-error"
              {...form.register("name")}
            />
            <FieldError id="provider-name-error" errors={[errors.name]} />
          </Field>
          <Controller
            control={form.control}
            name="logo"
            render={({ field, fieldState }) => (
              <LogoField
                id="provider-logo"
                label="Logotipo"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={pending || !canEdit}
              />
            )}
          />
        </fieldset>
      </DialogSection>
    </form>
  )
}
