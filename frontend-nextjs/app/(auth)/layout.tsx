import Image from "next/image"
import type { ReactNode } from "react"
import { Brand } from "@/components/brand/brand"
import { Card } from "@/components/ui/card"

function CompanyIdentity() {
  return (
    <div className="relative z-10 flex items-center justify-center gap-0 sm:gap-2 lg:justify-start">
      <Image
        src="/brand/logo.png"
        loading="eager"
        alt=""
        width={1000}
        height={1000}
        className="h-auto w-12 shrink-0 sm:w-20"
      />
      <img
        src="/brand/business-text.svg"
        alt="Não foi possível carregar a empresa"
        className="w-44 min-w-0 sm:w-72"
      />
    </div>
  )
}

function BrandWatermark() {
  return (
    <Image
      src="/brand/logo.png"
      loading="eager"
      alt=""
      aria-hidden="true"
      width={1000}
      height={1000}
      className="pointer-events-none absolute right-0 bottom-0 h-auto w-[27.6rem] translate-x-[42.55%] translate-y-[42.55%] opacity-[0.06]"
    />
  )
}

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-muted p-5 sm:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-4 -z-10 bg-[url('/login-background.png')] bg-cover bg-center blur-md"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-foreground/20"
      />
      <Card className="grid w-full max-w-5xl gap-0 rounded-3xl border p-0 shadow-xl lg:min-h-155 lg:grid-cols-2">
        <aside className="relative flex flex-col justify-between gap-12 overflow-hidden border-b bg-muted p-8 text-center sm:p-12 lg:min-h-96 lg:border-r lg:border-b-0 lg:text-left">
          <div className="relative z-10">
            <Brand />
            <div
              aria-hidden="true"
              className="mx-auto my-5 h-1 w-12 rounded-full bg-primary lg:mx-0"
            />
            <p className="text-base leading-snug text-muted-foreground sm:text-lg">
              Sistema de Gestão para Oficinas
            </p>
          </div>
          <div className="hidden lg:block">
            <CompanyIdentity />
            <BrandWatermark />
          </div>
        </aside>
        <section className="flex min-w-0 flex-col justify-center px-7 py-10 sm:p-12">
          {children}
        </section>
        <footer className="relative overflow-hidden border-t bg-muted p-8 text-center sm:p-12 lg:hidden">
          <CompanyIdentity />
          <BrandWatermark />
        </footer>
      </Card>
    </main>
  )
}
