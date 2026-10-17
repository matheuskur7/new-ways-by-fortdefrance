import Image from "next/image";
import type { ReactNode } from "react";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Card } from "@/components/ui/card";

function CompanyIdentity() {
  return (
    <div className="relative z-10 flex items-center justify-center gap-3 sm:gap-4 lg:justify-start">
      <Image
        src="/brand/logo.png"
        loading="eager"
        alt=""
        width={1000}
        height={1000}
        className="h-auto w-14 shrink-0 sm:w-20"
      />
      <div
        className="font-bold uppercase"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <p className="text-xl leading-none text-primary sm:text-2xl">
          Fort de France
        </p>
        <p className="mt-1 text-xs leading-none sm:text-sm">
          Diagnóstico inteligente
        </p>
      </div>
    </div>
  );
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
  );
}

export function AuthShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
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
      <Card
        className={`grid w-full gap-0 rounded-3xl border p-0 shadow-xl lg:min-h-155 ${wide ? "max-w-7xl lg:grid-cols-[0.8fr_1.5fr]" : "max-w-5xl lg:grid-cols-2"}`}
      >
        <aside className="relative flex flex-col justify-between gap-12 overflow-hidden border-b bg-muted p-8 text-center sm:p-12 lg:min-h-96 lg:border-r lg:border-b-0 lg:text-left">
          <div className="relative z-10">
            <BrandWordmark />
            <div
              aria-hidden="true"
              className="mx-auto my-5 h-1 w-12 rounded-full bg-primary lg:mx-0"
            />
            <p className="text-lg leading-snug text-muted-foreground">
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
  );
}
