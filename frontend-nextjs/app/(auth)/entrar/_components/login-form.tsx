"use client"

import Link from "next/link"
import { MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/password-input"
import { getErrorCode, getHttpStatus } from "@/lib/api"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import z from "zod"
import { ResendVerificationButton } from "@/features/session/components/resend-verification-button"
import { useLogin } from "../_hooks/use-login"

const loginFormSchema = z.object({
  email: z.email({ message: "Digite um email Válido!" }),
  password: z.string(),
})

type LoginFormData = z.infer<typeof loginFormSchema>

function loginErrorMessage(error: unknown) {
  if (getHttpStatus(error) === 401) return "Email ou senha inválidos."
  if (getHttpStatus(error) === 429)
    return "Muitas tentativas. Aguarde alguns instantes e tente novamente."
  return "Não foi possível entrar. Tente novamente mais tarde."
}

export default function LoginForm({ next }: { next: string }) {
  const login = useLogin(next)
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  })

  const { errors } = form.formState

  function onSubmit(data: LoginFormData) {
    login.mutate(data)
  }

  const unverified = getErrorCode(login.error) === "EMAIL_NOT_VERIFIED"

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      aria-busy={login.isPending}
      method="post"
    >
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            {...form.register("email")}
            id="email"
            type="email"
            className="h-12"
            autoComplete="email"
            disabled={login.isPending}
            placeholder="Seu e-mail"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <FieldError errors={[errors.email]} />}
        </Field>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <PasswordInput
            {...form.register("password")}
            id="password"
            autoComplete="current-password"
            disabled={login.isPending}
            placeholder="Digite sua senha"
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && <FieldError errors={[errors.password]} />}
        </Field>

        <Button
          variant="link"
          className="h-auto self-end p-0 underline"
          nativeButton={false}
          render={<Link href="/esqueci-senha" />}
        >
          Esqueci minha senha
        </Button>

        {login.isError &&
          (unverified ? (
            <div
              role="alert"
              className="grid gap-3 rounded-md border border-info/20 bg-info/10 p-3 text-sm text-foreground"
            >
              <p className="flex gap-2">
                <MailCheck
                  className="mt-0.5 size-4 shrink-0 text-info"
                  aria-hidden="true"
                />
                <span>
                  Confirme seu e-mail para entrar. Use o link enviado para{" "}
                  <strong>{login.variables?.email}</strong> ou peça um novo.
                </span>
              </p>
              {login.variables && (
                <ResendVerificationButton
                  key={login.variables.email}
                  email={login.variables.email}
                  next={next}
                  className="justify-self-end bg-background"
                />
              )}
            </div>
          ) : (
            <p role="alert" className="text-sm text-destructive">
              {loginErrorMessage(login.error)}
            </p>
          ))}

        <Button
          type="submit"
          size="lg"
          className="h-12 w-full"
          disabled={login.isPending}
        >
          {login.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </FieldGroup>
    </form>
  )
}
