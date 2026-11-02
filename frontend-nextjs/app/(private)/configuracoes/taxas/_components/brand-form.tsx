"use client"

import { useEffect, useState } from "react"
import { Controller, useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CreditCard, Percent } from "lucide-react"
import { EntityTimestamps } from "@/components/entity-timestamps"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from "@/components/ui/dialog"
import { LogoField } from "./logo-field"
import { resizeRates } from "../rates"
import {
  brandFormSchema,
  maxInstallments,
  toFormPercent,
  type BrandForm as BrandFormValues,
  type FeeBrand,
} from "../schemas"

function initialValues(brand?: FeeBrand): BrandFormValues {
  if (!brand)
    return { name: "", channel: "", logo: "", rates: resizeRates([], 12) }
  const rates = brand.rates.map((rate) => ({
    installments: rate.installments,
    ratePercent: toFormPercent(rate.ratePercent),
  }))
  // Sem truncar: grupos acima do limite abrem completos e a validação pede a redução.
  const count = Math.max(...rates.map((rate) => rate.installments))
  return {
    name: brand.name,
    channel: brand.channel,
    logo: brand.logo ?? "",
    rates: resizeRates(rates, count),
  }
}

export function BrandForm({
  brand,
  providerName,
  pending,
  onSubmit,
  onBack,
  onDirtyChange,
}: {
  brand?: FeeBrand
  providerName: string
  pending: boolean
  onSubmit: (values: BrandFormValues) => void
  onBack: () => void
  /** Informa se há edições não salvas, para confirmar a saída do formulário. */
  onDirtyChange: (dirty: boolean) => void
}) {
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: initialValues(brand),
  })
  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "rates",
  })
  const [count, setCount] = useState(String(fields.length))
  const { errors, isDirty } = form.formState

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  function changeCount(text: string) {
    setCount(text)
    const next = Number(text)
    if (!Number.isInteger(next) || next < 1 || next > maxInstallments) return
    replace(resizeRates(form.getValues("rates"), next))
  }

  return (
    <form
      className="grid gap-6"
      aria-busy={pending}
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <DialogHeader icon={CreditCard}>
        <DialogTitle>
          {brand ? "Editar grupo de taxas" : "Novo grupo de taxas"}
        </DialogTitle>
        <DialogDescription>
          {providerName}: defina as bandeiras atendidas e a taxa de cada
          parcela.
        </DialogDescription>
      </DialogHeader>
      <fieldset
        disabled={pending}
        className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]"
      >
        <DialogSection icon={CreditCard} title="Identificação">
          <Field>
            <FieldLabel htmlFor="brand-name">Bandeiras</FieldLabel>
            <Input
              id="brand-name"
              placeholder="Ex.: Mastercard / Visa"
              aria-invalid={!!errors.name}
              aria-describedby="brand-name-error"
              {...form.register("name")}
            />
            <FieldError id="brand-name-error" errors={[errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="brand-channel">Canal</FieldLabel>
            <Input
              id="brand-channel"
              placeholder="Ex.: Presencial"
              aria-invalid={!!errors.channel}
              aria-describedby="brand-channel-error"
              {...form.register("channel")}
            />
            <FieldError id="brand-channel-error" errors={[errors.channel]} />
          </Field>
          <Controller
            control={form.control}
            name="logo"
            render={({ field, fieldState }) => (
              <LogoField
                id="brand-logo"
                label="Logo das bandeiras"
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
                disabled={pending}
              />
            )}
          />
        </DialogSection>
        <DialogSection
          icon={Percent}
          title="Taxas por parcela"
          description="Percentual cobrado em cada quantidade de parcelas."
        >
          <Field className="max-w-48">
            <FieldLabel htmlFor="brand-count">
              Quantidade de parcelas
            </FieldLabel>
            <Input
              id="brand-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={maxInstallments}
              step={1}
              value={count}
              aria-describedby="brand-count-description"
              onChange={(event) => changeCount(event.target.value)}
              onBlur={() => setCount(String(fields.length))}
            />
            <FieldDescription id="brand-count-description">
              De 1 a {maxInstallments}.
            </FieldDescription>
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {fields.map((field, index) => (
              <Field key={field.id}>
                <FieldLabel htmlFor={`brand-rate-${index}`}>
                  {field.installments}x (%)
                </FieldLabel>
                <Input
                  id={`brand-rate-${index}`}
                  inputMode="decimal"
                  placeholder="0,00"
                  aria-invalid={!!errors.rates?.[index]?.ratePercent}
                  aria-describedby={`brand-rate-error-${index}`}
                  {...form.register(`rates.${index}.ratePercent`)}
                />
                <FieldError
                  id={`brand-rate-error-${index}`}
                  errors={[errors.rates?.[index]?.ratePercent]}
                />
              </Field>
            ))}
          </div>
          <FieldError errors={[errors.rates?.root ?? errors.rates]} />
        </DialogSection>
      </fieldset>
      {brand && (
        <EntityTimestamps
          createdAt={brand.createdAt}
          updatedAt={brand.updatedAt}
        />
      )}
      <DialogFooter className="-mx-6 -mb-6 border-t bg-muted/60 px-6 py-4 sm:items-center">
        <Button
          type="button"
          variant="outline"
          className="sm:mr-auto"
          disabled={pending}
          onClick={onBack}
        >
          <ArrowLeft /> Voltar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : brand ? "Salvar grupo" : "Adicionar grupo"}
        </Button>
      </DialogFooter>
    </form>
  )
}
