"use client"

import { isAxiosError } from "axios"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"
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
import { useLogin } from "../hooks/use-login"

const loginFormSchema = z.object({
  email: z.email({ message: "Digite um email Válido!" }),
  password: z.string(),
})

type LoginFormData = z.infer<typeof loginFormSchema>

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const login = useLogin()
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
          <div className="relative">
            <Input
              {...form.register("password")}
              id="password"
              type={showPassword ? "text" : "password"}
              className="h-12 pr-12"
              autoComplete="current-password"
              disabled={login.isPending}
              placeholder="Digite sua senha"
              aria-invalid={Boolean(errors.password)}
            />
            <Tooltip>
              <TooltipTrigger
                className="absolute top-2 right-2"
                render={<span />}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-controls="password"
                  aria-pressed={showPassword}
                  disabled={login.isPending}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showPassword ? "Ocultar senha" : "Mostrar senha"}
              </TooltipContent>
            </Tooltip>
          </div>
          {errors.password && <FieldError errors={[errors.password]} />}
        </Field>

        <Button
          type="button"
          variant="link"
          className="h-auto self-end p-0 underline"
          disabled
        >
          Esqueci minha senha
        </Button>

        {login.isError && (
          <p role="alert" className="text-sm text-destructive">
            {isAxiosError(login.error) && login.error.response?.status === 401
              ? "Email ou senha inválidos."
              : "Ocorreu um erro desconhecido."}
          </p>
        )}

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
