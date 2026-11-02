"use client"

import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle, MailCheck } from "lucide-react"
import { useForm } from "react-hook-form"
import { PasswordInput } from "@/components/password-input"
import { StatusPanel } from "@/components/status-panel"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getHttpStatus } from "@/lib/api"
import { ResendVerificationButton } from "@/features/session/components/resend-verification-button"
import { useSignUp } from "../_hooks/use-sign-up"
import { signUpFormSchema, type SignUpFormData } from "../schemas"

export function SignUpForm({
  next,
  loginHref,
}: {
  next: string
  loginHref: string
}) {
  const signUp = useSignUp(next)
  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  })
  const { errors } = form.formState
  const pending = signUp.isPending

  if (signUp.isSuccess)
    return (
      <StatusPanel
        icon={MailCheck}
        tone="success"
        title="Confira seu e-mail"
        description={
          <>
            Enviamos um link de confirmação para{" "}
            <strong className="text-foreground">
              {signUp.variables.email}
            </strong>
            . Abra o e-mail e confirme o endereço para acessar o sistema. Não
            encontrou? Verifique a caixa de spam.
          </>
        }
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href={loginHref} />}
        >
          Voltar para o login
        </Button>
        <ResendVerificationButton
          email={signUp.variables.email}
          next={next}
          sentRecently
          variant="default"
        />
      </StatusPanel>
    )

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((data) => signUp.mutate(data))}
      aria-busy={pending}
    >
      <FieldGroup className="gap-4">
        <Field data-invalid={Boolean(errors.name)}>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            {...form.register("name")}
            id="name"
            className="h-12"
            autoComplete="name"
            placeholder="Seu nome completo"
            disabled={pending}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <FieldError errors={[errors.name]} />}
        </Field>
        <Field data-invalid={Boolean(errors.email)}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
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
          {errors.email ? (
            <FieldError errors={[errors.email]} />
          ) : (
            <FieldDescription>
              Se recebeu um convite, use o mesmo e-mail do convite.
            </FieldDescription>
          )}
        </Field>
        <Field data-invalid={Boolean(errors.password)}>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
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
          <FieldLabel htmlFor="confirmPassword">Confirmar senha</FieldLabel>
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

        {signUp.isError && (
          <p role="alert" className="text-sm text-destructive">
            {getHttpStatus(signUp.error) === 429
              ? "Muitas tentativas. Aguarde alguns instantes e tente novamente."
              : "Não foi possível criar a conta. Confira os dados e tente novamente."}
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
          {pending ? "Criando conta…" : "Criar conta"}
        </Button>
      </FieldGroup>
    </form>
  )
}
