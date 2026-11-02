"use client"

import { ViewTransition, type ReactNode } from "react"

/**
 * Anima largura e altura do cartão das telas de autenticação ao navegar entre
 * elas (login, cadastro, recuperação de senha...), em vez de um corte seco.
 * O estilo da transição fica em `globals.css` (classe `auth-shell`).
 */
export function AuthShellTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition update="auth-shell" default="none">
      {children}
    </ViewTransition>
  )
}
