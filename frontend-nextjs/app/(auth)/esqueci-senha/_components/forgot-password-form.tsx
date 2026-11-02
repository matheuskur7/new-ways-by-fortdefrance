"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { LoaderCircle, MailCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { StatusPanel } from "@/components/status-panel"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getHttpStatus } from "@/lib/api"
import { emailSchema } from "@/features/session/schemas"
import { requestPasswordReset } from "../_services/request-password-reset"

const forgotPasswordSchema = z.object({ email: emailSchema })
type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const request = useMutation({
    mutationFn: ({ email }: ForgotPasswordData) => requestPasswordReset(email),
  })
  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })
  const { errors } = form.formState
  const pending = request.isPending

  if (request.isSuccess)
    return (
      <StatusPanel
        icon={MailCheck}
        tone="success"
        title="Verifique seu e-mail"
        description={
          <>
            Se houver uma conta para{" "}
            <strong className="text-foreground">
              {request.variables.email}
            </strong>
            , você receberá um link para criar uma nova senha. O link expira em
            1 hora.
          </>
        }
      >
        <Button
          variant="outline"
          onClick={() => {
            request.reset()
            form.reset()
          }}
        >
          Usar outro e-mail
        </Button>
        <Button nativeButton={false} render={<Link href="/entrar" />}>
          Voltar para o login
        </Button>
      </StatusPanel>
    )

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => request.mutate(data))}
      aria-busy={pending}
    >
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">E-mail da conta</FieldLabel>
          <Input
            {...form.register("email")}
            id="email"
            type="email"
            className="h-12"
            autoComplete="email"
            placeholder="nome@exemplo.com"
            disabled={pending}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <FieldError errors={[errors.email]} />}
        </Field>

        {request.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getHttpStatus(request.error) === 429
              ? "Muitas solicitações. Aguarde alguns instantes e tente novamente."
              : "Não foi possível enviar o link. Tente novamente mais tarde."}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full"
          disabled={pending}
        >
          {pending && (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {pending ? "Enviando…" : "Enviar link de redefinição"}
        </Button>
      </FieldGroup>
    </form>
  )
}
