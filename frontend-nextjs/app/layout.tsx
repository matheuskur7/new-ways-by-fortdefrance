import { Roboto } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"

const roboto = Roboto({ subsets: ["latin"], variable: "--font-sans" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-br" className={cn("antialiased", "font-sans", roboto.variable)}>
      <body>{children}</body>
    </html>
  )
}
