"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2 } from "lucide-react"
import { DialogSection } from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { useUpdateOrganization } from "../hooks/use-update-organization"
import {
  companyDetailsSchema,
  type CompanyDetailsData,
  type ManagedOrganization,
} from "../schemas"

/**
 * Seção com os dados editáveis da empresa. O botão de salvar fica no rodapé do
 * modal e envia este formulário pelo atributo `form`.
 */
export function CompanyDetailsForm({
  id,
  organization,
  update,
  onDirtyChange,
  onSaved,
}: {
  id: string
  organization: ManagedOrganization
  update: ReturnType<typeof useUpdateOrganization>
  /** Informa se há edições não salvas, para confirmar o fechamento do modal. */
  onDirtyChange: (dirty: boolean) => void
  onSaved: () => void
}) {
  const form = useForm<CompanyDetailsData>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      name: organization.name,
      email: organization.email ?? "",
      address: organization.address ?? "",
    },
  })
  const { errors, isDirty } = form.formState
  const pending = update.isPending

  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange])

  function onSubmit(data: CompanyDetailsData) {
    update.mutate(data, {
      onSuccess: (saved) => {
        form.reset({
          name: saved.name,
          email: saved.email ?? "",
          address: saved.address ?? "",
        })
        onSaved()
      },
    })
  }

  return (
    <DialogSection
      icon={Building2}
      title="Dados da empresa"
      description="Nome e contatos exibidos no sistema."
    >
      <form
        autoComplete="off"
        id={id}
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        aria-busy={pending}
      >
        <FieldGroup className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={Boolean(errors.name)}>
            <FieldLabel htmlFor="company-name">Nome da empresa</FieldLabel>
            <Input
              id="company-name"
              {...form.register("name")}
              disabled={pending}
              aria-invalid={Boolean(errors.name)}
              aria-describedby="company-name-error"
              autoComplete="off"
            />
            <FieldError id="company-name-error" errors={[errors.name]} />
          </Field>
          <Field>
            <FieldLabel
              htmlFor="company-code"
              className="flex-wrap items-baseline gap-x-2 gap-y-0"
            >
              Código{" "}
              <span
                id="company-code-description"
                className="text-xs font-normal text-muted-foreground"
              >
                Não pode ser alterado
              </span>
            </FieldLabel>
            <Input
              id="company-code"
              autoComplete="off"
              value={organization.slug}
              disabled
              aria-describedby="company-code-description"
            />
          </Field>
          <Field className="sm:col-span-2" data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="company-email">E-mail da empresa</FieldLabel>
            <Input
              id="company-email"
              {...form.register("email")}
              disabled={pending}
              aria-invalid={Boolean(errors.email)}
              aria-describedby="company-email-error"
              type="email"
              placeholder="contato@empresa.com.br"
              autoComplete="off"
            />
            <FieldError id="company-email-error" errors={[errors.email]} />
          </Field>
          <Field
            className="sm:col-span-2"
            data-invalid={Boolean(errors.address)}
          >
            <FieldLabel htmlFor="company-address">Endereço</FieldLabel>
            <Input
              id="company-address"
              {...form.register("address")}
              disabled={pending}
              aria-invalid={Boolean(errors.address)}
              aria-describedby="company-address-error"
              autoComplete="off"
              placeholder="Rua, número, bairro, cidade e CEP"
              maxLength={500}
            />
            <FieldError id="company-address-error" errors={[errors.address]} />
          </Field>
        </FieldGroup>
      </form>
    </DialogSection>
  )
}
