"use client"

import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { CreditCard, Layers3, Percent } from "lucide-react"
import { FeeDialogHeader } from "./fee-dialog-header"
import { FormActions, type EditorActions } from "./form-actions"
import {
  groupFormSchema,
  type GroupForm,
  type ManagedGroup,
  type ManagedProvider,
} from "../management-schemas"

export function GroupEditor({
  group,
  providers,
  selectedId,
  onSave,
  onCancel,
  pending,
  onRemove,
}: {
  group?: ManagedGroup
  providers: ManagedProvider[]
  selectedId: string
  onSave: (values: GroupForm) => void
} & EditorActions) {
  const form = useForm<GroupForm>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: group
      ? {
          ...group,
          logoSvg: group.logoSvg ?? "",
          rates: group.rates.length
            ? group.rates
            : [{ installments: 1, ratePercent: "" }],
        }
      : {
          providerId: selectedId,
          name: "",
          channel: "",
          displayOrder: 100,
          logoSvg: "",
          rates: [{ installments: 1, ratePercent: "" }],
        },
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rates",
  })
  const { errors } = form.formState

  return (
    <form
      className="grid gap-8"
      aria-busy={pending}
      onSubmit={form.handleSubmit(onSave)}
    >
      <FeeDialogHeader
        icon={Layers3}
        title={group ? "Editar grupo" : "Novo grupo"}
        description={
          "Defina o grupo, a quantidade de parcelas e o percentual de cada taxa."
        }
      />
      <fieldset
        disabled={pending}
        className="grid min-w-0 gap-6 py-3 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]"
      >
        <div className="grid min-w-0 content-start gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <CreditCard
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Dados do grupo
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Identificação e exibição das opções de pagamento.
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="group-provider">Provedor</FieldLabel>
            <select
              id="group-provider"
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              {...form.register("providerId")}
              aria-invalid={!!errors.providerId}
              aria-describedby="group-provider-error"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <FieldError
              id="group-provider-error"
              errors={[errors.providerId]}
            />
          </Field>
          {(
            [
              ["name", "Nome do grupo", "Ex.: Visa / Mastercard"],
              ["channel", "Canal", "Ex.: Presencial"],
            ] as const
          ).map(([name, label, placeholder]) => (
            <Field key={name}>
              <FieldLabel htmlFor={`group-${name}`}>{label}</FieldLabel>
              <Input
                id={`group-${name}`}
                placeholder={placeholder}
                type="text"
                {...form.register(name)}
                aria-invalid={!!errors[name]}
                aria-describedby={`group-${name}-error`}
              />
              <FieldError id={`group-${name}-error`} errors={[errors[name]]} />
            </Field>
          ))}
          <Field>
            <FieldLabel htmlFor="group-logo">Logo SVG (opcional)</FieldLabel>
            <textarea
              id="group-logo"
              rows={2}
              className="w-full rounded-md border bg-background p-3 text-sm"
              {...form.register("logoSvg")}
              aria-invalid={!!errors.logoSvg}
              aria-describedby="group-logo-error"
            />
            <FieldError id="group-logo-error" errors={[errors.logoSvg]} />
          </Field>
        </div>
        <div className="grid min-w-0 content-start gap-4 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Percent
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Taxas por parcela
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Defina quantas opções serão oferecidas e o percentual de cada uma.
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="group-count">
              Quantidade de parcelas
            </FieldLabel>
            <Input
              id="group-count"
              required
              type="number"
              min={1}
              max={32767}
              step={1}
              defaultValue={fields.length}
              onChange={(event) => {
                const count = Number(event.target.value)
                if (!Number.isInteger(count) || count < 1 || count > 32767)
                  return
                if (count > fields.length) {
                  const existing = new Set(
                    form.getValues("rates").map((rate) => rate.installments)
                  )
                  const extra = []
                  for (
                    let installments = 1;
                    extra.length < count - fields.length;
                    installments++
                  )
                    if (!existing.has(installments))
                      extra.push({ installments, ratePercent: "" })
                  append(extra, { shouldFocus: false })
                } else if (count < fields.length)
                  remove(
                    Array.from(
                      { length: fields.length - count },
                      (_, index) => count + index
                    )
                  )
              }}
            />
            <p className="text-sm text-muted-foreground">
              Informe qualquer quantidade. Ao reduzir, as taxas excedentes serão
              removidas ao salvar.
            </p>
          </Field>
          <div className="grid grid-cols-2 gap-3 p-1 sm:grid-cols-3 xl:grid-cols-4">
            {fields.map((field, index) => (
              <Field key={field.id}>
                <FieldLabel htmlFor={`group-rate-${index}`}>
                  Taxa para {field.installments}x (%)
                </FieldLabel>
                <input
                  type="hidden"
                  {...form.register(`rates.${index}.installments`, {
                    valueAsNumber: true,
                  })}
                />
                <Input
                  id={`group-rate-${index}`}
                  inputMode="decimal"
                  placeholder="0,00"
                  {...form.register(`rates.${index}.ratePercent`)}
                  aria-invalid={!!errors.rates?.[index]?.ratePercent}
                  aria-describedby={`group-rate-error-${index}`}
                />
                <FieldError
                  id={`group-rate-error-${index}`}
                  errors={[errors.rates?.[index]?.ratePercent]}
                />
              </Field>
            ))}
          </div>
          <FieldError errors={[errors.rates?.root]} />
        </div>
      </fieldset>
      <FormActions
        pending={pending}
        onCancel={onCancel}
        onRemove={onRemove}
        removalTitle="Remover grupo?"
        removalDescription="Remover este grupo e todas as taxas cadastradas nele?"
      />
    </form>
  )
}
