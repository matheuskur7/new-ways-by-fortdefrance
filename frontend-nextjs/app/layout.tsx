import { Roboto } from "next/font/google"

import "./globals.css"
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-br"
      className={cn("antialiased", "font-sans", roboto.variable)}
    >
      <body className="relative">
        <ToastProvider>
          <AnchoredToastProvider>
            <div className="relative isolate min-h-svh">{children}</div>
          </AnchoredToastProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
