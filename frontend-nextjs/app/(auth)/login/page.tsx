"use client"

import { Brand } from "@/components/brand/brand"
import { BusinessBrand } from "@/components/brand/business-brand"
import { Card } from "@/components/ui/card"
import LoginForm from "./components/login-form"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  return (
    <Card className="m-4 w-full max-w-110 gap-0 overflow-hidden rounded-2xl border-0 border-t-5 border-primary p-0 shadow-2xl sm:m-8">
      <header className="px-8 pt-8 text-center">
        <Brand variant="text" />
        <Separator className="my-4" />
      </header>
      <section
        aria-label="Área de acesso à conta"
        className="py-2 px-8 "
      >
        <h1 className="text-center text-xl font-semibold tracking-tight pb-4">
          Acesse sua conta
        </h1>
        <LoginForm />
      </section>

      <footer className="flex flex-wrap items-end justify-center gap-5 border-t bg-muted px-6 py-5 sm:px-10">
        <BusinessBrand />
      </footer>
    </Card>
  )
}
