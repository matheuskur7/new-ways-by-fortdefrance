"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Building2 } from "lucide-react"
import { FeeDialogHeader } from "./fee-dialog-header"
import { FormActions } from "./form-actions"
import {
  providerFormSchema,
  type ProviderForm,
  type ManagedProvider,
} from "../management-schemas"

export function ProviderEditor({
  provider,
  providers,
  onSave,
  onCancel,
  pending,
  onRemove,
}: {
  provider?: ManagedProvider
  providers: ManagedProvider[]
  onSave: (values: ProviderForm) => void
  pending: boolean
  onCancel: () => void
  onRemove?: () => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ProviderForm>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: { name: provider?.name ?? "" },
  })

  return (
    <form
      className="grid gap-6"
      aria-busy={pending}
      onSubmit={handleSubmit((values) => {
        if (
          providers.some(
            (item) =>
              item.id !== provider?.id &&
              item.name.toLocaleLowerCase("pt-BR") ===
                values.name.toLocaleLowerCase("pt-BR")
          )
        ) {
          setError("name", { message: "Já existe um provedor com este nome." })
          return
        }
        onSave(values)
      })}
    >
      <fieldset disabled={pending} className="grid gap-6">
        <FeeDialogHeader
          icon={Building2}
          title={provider ? "Editar provedor" : "Novo provedor"}
          description={"Identifique a empresa responsável pelas taxas."}
        />
        <Field className="py-3">
          <FieldLabel htmlFor="provider-name">Nome</FieldLabel>
          <Input
            id="provider-name"
            placeholder="Ex.: InfinitePay"
            aria-invalid={!!errors.name}
            aria-describedby="provider-name-error"
            {...register("name")}
          />
          <FieldError id="provider-name-error" errors={[errors.name]} />
        </Field>
      </fieldset>
      <FormActions
        onCancel={onCancel}
        pending={pending}
        onRemove={onRemove}
        removalTitle="Remover provedor?"
        removalDescription="Remover este provedor? Ele só pode ser removido quando não possuir grupos."
      />
    </form>
  )
}
