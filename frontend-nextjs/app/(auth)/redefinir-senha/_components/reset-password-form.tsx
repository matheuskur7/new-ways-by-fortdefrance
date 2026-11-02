"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CircleCheck, LinkIcon, LoaderCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { PasswordInput } from "@/components/password-input"
import { StatusPanel } from "@/components/status-panel"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { getErrorCode, getHttpStatus } from "@/lib/api"
import { resetPassword } from "../_services/reset-password"
import { resetPasswordFormSchema, type ResetPasswordFormData } from "../schemas"

export function InvalidResetLink() {
  return (
    <StatusPanel
      icon={LinkIcon}
      tone="destructive"
      role="alert"
      title="Link inválido ou expirado"
      description="Este link de redefinição não pode mais ser usado. Solicite um novo link para criar sua senha."
    >
      <Button nativeButton={false} render={<Link href="/esqueci-senha" />}>
        Solicitar novo link
      </Button>
    </StatusPanel>
  )
}

export function ResetPasswordForm({ token }: { token: string }) {
  const queryClient = useQueryClient()
  const reset = useMutation({
    mutationFn: ({ password }: ResetPasswordFormData) =>
      resetPassword(token, password),
    // As sessões abertas são encerradas pelo backend após a troca de senha.
    onSuccess: () => queryClient.clear(),
  })
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })
  const { errors } = form.formState
  const pending = reset.isPending

  if (reset.isSuccess)
    return (
      <StatusPanel
        icon={CircleCheck}
        tone="success"
        title="Senha alterada"
        description="Sua nova senha já está valendo. Por segurança, encerramos as sessões abertas em outros dispositivos."
      >
        <Button nativeButton={false} render={<Link href="/entrar" />}>
          Entrar com a nova senha
        </Button>
      </StatusPanel>
    )

  const code = getErrorCode(reset.error)
  if (code === "INVALID_TOKEN" || code === "USER_NOT_FOUND")
    return <InvalidResetLink />

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => reset.mutate(data))}
      aria-busy={pending}
    >
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Nova senha</FieldLabel>
          <PasswordInput
            {...form.register("password")}
            id="password"
            autoComplete="new-password"
            placeholder="Pelo menos 8 caracteres"
            disabled={pending}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && <FieldError errors={[errors.password]} />}
        </Field>
        <Field data-invalid={Boolean(errors.confirmPassword)}>
          <FieldLabel htmlFor="confirmPassword">
            Confirmar nova senha
          </FieldLabel>
          <PasswordInput
            {...form.register("confirmPassword")}
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Digite a senha novamente"
            disabled={pending}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
          {errors.confirmPassword && (
            <FieldError errors={[errors.confirmPassword]} />
          )}
        </Field>

        {reset.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getHttpStatus(reset.error) === 429
              ? "Muitas tentativas. Aguarde alguns instantes e tente novamente."
              : "Não foi possível alterar a senha. Tente novamente."}
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
          {pending ? "Salvando…" : "Salvar nova senha"}
        </Button>
      </FieldGroup>
    </form>
  )
}
