"use client"

import { useState } from "react"
import { MailPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { MemberRoleSelect, type MemberRole } from "./member-role-select"

export function MemberInvitation() {
  const [role, setRole] = useState<MemberRole>("member")
  return (
    <Card size="sm" className="h-full gap-3 ring-0">
      <CardHeader>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <MailPlus
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />{" "}
          Convidar membro
        </h2>
      </CardHeader>
      <CardContent className="flex-1">
        <form
          autoComplete="off"
          id="member-invitation"
          onSubmit={(event) => event.preventDefault()}
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
              <FieldLabel htmlFor="invitation-role">
                Cargo na empresa
              </FieldLabel>
              <MemberRoleSelect
                id="invitation-role"
                value={role}
                onChange={setRole}
                label="Cargo do novo membro"
              />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="mt-auto justify-end">
        <Button
          form="member-invitation"
          type="submit"
          variant="outline"
          disabled
        >
          <MailPlus aria-hidden="true" /> Enviar convite
        </Button>
      </CardFooter>
    </Card>
  )
}
