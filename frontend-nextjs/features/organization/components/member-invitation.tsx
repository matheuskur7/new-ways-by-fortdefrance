"use client"

import { useState } from "react"
import { MailPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DialogSection } from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { MemberRoleSelect, type MemberRole } from "./member-role-select"

export function MemberInvitation() {
  const [role, setRole] = useState<MemberRole>("member")
  return (
    <DialogSection
      icon={MailPlus}
      title="Convidar membro"
      description="Adicione alguém à equipe da empresa."
    >
      <form
        autoComplete="off"
        onSubmit={(event) => event.preventDefault()}
        className="grid gap-4"
      >
        <FieldGroup className="grid gap-3">
          <Field>
            <FieldLabel htmlFor="invitation-email">
              E-mail do novo membro
            </FieldLabel>
            <Input
              id="invitation-email"
              name="email"
              type="email"
              placeholder="nome@exemplo.com"
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="invitation-role">Cargo na empresa</FieldLabel>
            <MemberRoleSelect
              id="invitation-role"
              value={role}
              onChange={setRole}
              label="Cargo do novo membro"
            />
          </Field>
        </FieldGroup>
        <Button
          type="submit"
          variant="outline"
          disabled
          className="justify-self-end"
        >
          <MailPlus aria-hidden="true" /> Enviar convite
        </Button>
      </form>
    </DialogSection>
  )
}
