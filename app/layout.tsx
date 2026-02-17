import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://educando.app"),
  title: {
    default: "educando.app — Crie atividades escolares com IA em 30 segundos. 5 por dia, gratis.",
    template: "%s | educando.app",
  },
  description:
    "Com o educando.app, voce transforma qualquer tema em atividades pedagogicas completas, com codigos da BNCC e prontas para imprimir. Tudo em segundos, direto no navegador e sem necessidade de login.",
  keywords: [
    "gerador de atividades",
    "atividades escolares",
    "ensino fundamental",
    "BNCC",
    "alfabetizacao",
    "atividades para imprimir",
    "professor",
    "educacao",
    "inteligencia artificial",
    "IA educacao",
    "material didatico",
    "recurso pedagogico",
    "30 segundos",
    "sem login",
    "gratis",
  ],
  authors: [{ name: "educando.app" }],
  creator: "educando.app",
  publisher: "educando.app",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://educando.app",
    siteName: "educando.app",
    title: "educando.app — Crie atividades escolares com IA em 30 segundos",
    description:
      "Transforme qualquer tema em atividades pedagogicas completas, alinhadas a BNCC e prontas para imprimir. 5 atividades gratis por dia!",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 1024,
        alt: "educando.app - Gerador de Atividades Escolares",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "educando.app — Crie atividades escolares com IA em 30 segundos",
    description:
      "Transforme qualquer tema em atividades pedagogicas completas, alinhadas a BNCC e prontas para imprimir.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://educando.app",
  },
  category: "education",
}

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
