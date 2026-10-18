"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useUpdateOrganization } from "../hooks/use-update-organization"
import {
  companyDetailsSchema,
  type CompanyDetailsData,
  type ManagedOrganization,
} from "../schemas"
import { Building2, LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function CompanyDetails({
  organization,
  userId,
}: {
  organization: ManagedOrganization
  userId: string
}) {
  const update = useUpdateOrganization(userId, organization.id)
  const form = useForm<CompanyDetailsData>({
    resolver: zodResolver(companyDetailsSchema),
    defaultValues: {
      name: organization.name,
      email: organization.email ?? "",
      address: organization.address ?? "",
    },
  })
  const { errors, isDirty } = form.formState

  function onSubmit(data: CompanyDetailsData) {
    update.mutate(data, {
      onSuccess: (saved) =>
        form.reset({
          name: saved.name,
          email: saved.email ?? "",
          address: saved.address ?? "",
        }),
    })
  }
  return (
    <Card size="sm" className="h-full gap-3 ring-0">
      <CardHeader>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Building2
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />{" "}
          Dados da empresa
        </h2>
      </CardHeader>
      <CardContent className="flex-1">
        <form
          autoComplete="off"
          id="company-details"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          aria-busy={update.isPending}
        >
          <FieldGroup className="grid gap-3 sm:grid-cols-2">
            <Field data-invalid={Boolean(errors.name)}>
              <FieldLabel htmlFor="company-name">Nome da empresa</FieldLabel>
              <Input
                id="company-name"
                {...form.register("name")}
                disabled={update.isPending}
                aria-invalid={Boolean(errors.name)}
                autoComplete="off"
              />
              {errors.name && <FieldError errors={[errors.name]} />}
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
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(errors.email)}
            >
              <FieldLabel htmlFor="company-email">E-mail da empresa</FieldLabel>
              <Input
                id="company-email"
                {...form.register("email")}
                disabled={update.isPending}
                aria-invalid={Boolean(errors.email)}
                type="email"
                placeholder="contato@empresa.com.br"
                autoComplete="off"
              />
              {errors.email && <FieldError errors={[errors.email]} />}
            </Field>
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(errors.address)}
            >
              <FieldLabel htmlFor="company-address">Endereço</FieldLabel>
              <Input
                id="company-address"
                {...form.register("address")}
                disabled={update.isPending}
                aria-invalid={Boolean(errors.address)}
                autoComplete="off"
                placeholder="Rua, número, bairro, cidade e CEP"
                maxLength={500}
              />
              {errors.address && <FieldError errors={[errors.address]} />}
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="mt-auto justify-end">
        <Button
          form="company-details"
          type="submit"
          disabled={update.isPending || !isDirty}
        >
          {update.isPending ? (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <Save aria-hidden="true" />
          )}
          {update.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </CardFooter>
    </Card>
  )
}
