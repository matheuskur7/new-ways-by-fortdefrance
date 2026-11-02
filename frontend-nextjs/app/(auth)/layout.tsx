import Image from "next/image"
import type { ReactNode } from "react"
import { Brand } from "@/components/brand/brand"
import { Card } from "@/components/ui/card"
import { cn } from "cn"

function CompanyIdentity({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 lg:justify-start",
        className
      )}
    >
      <Image
        src="/brand/logo.png"
        loading="eager"
        alt=""
        width={1000}
        height={1000}
        className="h-auto w-12 shrink-0 sm:w-16"
      />
      <img
        src="/brand/business-text.svg"
        alt="Não foi possível carregar a empresa"
        className="w-40 min-w-0 sm:w-64"
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
      className="pointer-events-none absolute -right-24 -bottom-24 h-auto w-[30rem] brightness-0 invert opacity-[0.06]"
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
      <Card className="grid w-full max-w-5xl gap-0 overflow-hidden rounded-3xl border p-0 shadow-xl lg:min-h-155 lg:grid-cols-2">
        <aside className="relative isolate flex flex-col gap-8 overflow-hidden bg-foreground p-8 text-background sm:p-10 lg:gap-12 lg:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[url('/login-background.png')] bg-cover bg-center opacity-25 mix-blend-luminosity"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-foreground via-foreground/90 to-primary/35"
          />
          <div className="relative z-10 flex items-start">
            <div className="rounded-2xl bg-background p-4 text-foreground shadow-xl">
              <Brand />
            </div>
          </div>
          <div className="relative z-10 mt-auto grid gap-5">
            <div aria-hidden="true" className="h-1 w-14 rounded-full bg-primary" />
            <p className="max-w-md text-2xl leading-snug font-medium text-background/90 sm:text-3xl">
              Sistema de Gestão para Oficinas
            </p>
          </div>
          <div className="relative z-10 hidden w-fit rounded-2xl bg-background p-4 text-foreground shadow-xl lg:block">
            <CompanyIdentity />
          </div>
          <BrandWatermark />
        </aside>
        <section className="flex min-w-0 flex-col justify-center px-7 py-10 sm:p-12">
          {children}
        </section>
        <footer className="border-t bg-muted p-8 text-center lg:hidden">
          <CompanyIdentity className="justify-center" />
        </footer>
      </Card>
    </main>
  )
}
