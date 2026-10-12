import type { Metadata } from "next";
import { Geist_Mono, Roboto } from "next/font/google";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/query-provider";
import { ToastProvider } from "@/components/toast-provider";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  fallback: ["sans-serif"],
  adjustFontFallback: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "New Ways",
  description: "Seu espaço de trabalho e suas empresas.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={cn(
        "h-full antialiased",
        roboto.className,
        geistMono.variable,
        roboto.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </QueryProvider>
        <ToastProvider />
      </body>
    </html>
  );
}
