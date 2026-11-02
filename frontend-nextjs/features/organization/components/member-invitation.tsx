"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle, MailPlus } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { DialogSection } from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useInviteMember } from "../hooks/use-invite-member"
import { inviteMemberSchema, type InviteMemberData } from "../schemas"
import { MemberRoleSelect } from "./member-role-select"

export function MemberInvitation({
  organizationId,
}: {
  organizationId: string
}) {
  const invite = useInviteMember(organizationId)
  const form = useForm<InviteMemberData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "member" },
  })
  const { errors } = form.formState
  const pending = invite.isPending

  return (
    <DialogSection
      icon={MailPlus}
      title="Convidar membro"
      description="Adicione alguém à equipe da empresa."
    >
      <form
        noValidate
        autoComplete="off"
        aria-busy={pending}
        onSubmit={form.handleSubmit((data) =>
          invite.mutate(data, {
            onSuccess: () => form.reset({ email: "", role: data.role }),
          })
        )}
        className="grid gap-4"
      >
        <FieldGroup className="grid gap-3">
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor="invitation-email">
              E-mail do novo membro
            </FieldLabel>
            <Input
              {...form.register("email")}
              id="invitation-email"
              type="email"
              placeholder="nome@exemplo.com"
              autoComplete="off"
              disabled={pending}
              aria-invalid={Boolean(errors.email)}
            />
            {errors.email ? (
              <FieldError errors={[errors.email]} />
            ) : (
              <FieldDescription>
                A pessoa receberá um e-mail para aceitar o convite.
              </FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="invitation-role">Cargo na empresa</FieldLabel>
            <Controller
              control={form.control}
              name="role"
              render={({ field }) => (
                <MemberRoleSelect
                  id="invitation-role"
                  value={field.value}
                  onChange={field.onChange}
                  label="Cargo do novo membro"
                  disabled={pending}
                />
              )}
            />
          </Field>
        </FieldGroup>
        <Button
          type="submit"
          variant="outline"
          disabled={pending}
          className="justify-self-end"
        >
          {pending ? (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          ) : (
            <MailPlus aria-hidden="true" />
          )}
          {pending ? "Enviando…" : "Enviar convite"}
        </Button>
      </form>
    </DialogSection>
  )
}
