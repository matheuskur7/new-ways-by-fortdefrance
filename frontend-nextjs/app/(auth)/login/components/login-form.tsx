"use client"

import { isAxiosError } from "axios"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import z from "zod"
import { useLogin } from "../hooks/use-login"

const loginFormSchema = z.object({
  email: z.email({ message: "Digite um email Válido!" }),
  password: z.string(),
})

type LoginFormData = z.infer<typeof loginFormSchema>

export default function LoginForm() {
  const login = useLogin()
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  })

  function onSubmit(data: LoginFormData) {
    login.mutate(data)
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        {/* EMAIL */}
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>

              <Input
                {...field}
                id={field.name}
                type="email"
                placeholder="Digite seu email"
                aria-invalid={fieldState.invalid}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {/* SENHA */}
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Senha</FieldLabel>

              <Input
                {...field}
                id={field.name}
                type="password"
                placeholder="Digite sua senha"
                aria-invalid={fieldState.invalid}
              />

              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {login.isError && (
          <p role="alert" className="text-sm text-destructive">
            {isAxiosError(login.error) && login.error.response?.status === 401
              ? "Email ou senha inválidos."
              : "Ocorreu um erro desconhecido."}
          </p>
        )}

        <Button type="submit" size={"lg"} disabled={login.isPending}>
          {login.isPending ? "Entrando..." : "Entrar"}
        </Button>
      </FieldGroup>
    </form>
  )
}
