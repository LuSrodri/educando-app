import type React from "react"
import type { Metadata, Viewport } from "next"
import { Nunito, Nunito_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _nunito = Nunito({ subsets: ["latin"] })
const _nunitoSans = Nunito_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://educando.app"),
  title: {
    default: "Crie atividade escolares alinhadas à BNCC a partir de um tema — prontas para imprimir — em 30 segundos. Sem login. 3 atividades gratuitas por dia. Acesse educando.app",
    template: "%s | educando.app",
  },
  description:
    "Com o educando.app, você transforma qualquer tema em atividades pedagógicas completas, com códigos da BNCC e prontas para imprimir. Tudo em segundos, direto no navegador e sem necessidade de login. Recupere seu tempo livre e garanta aulas criativas hoje mesmo!",
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
    "atividades 1o ano",
    "atividades 2o ano",
    "atividades 3o ano",
    "atividades 4o ano",
    "atividades 5o ano",
    "atividades 6o ano",
    "atividades 7o ano",
    "atividades 8o ano",
    "atividades 9o ano",
    "ensino fundamental I",
    "ensino fundamental II",
    "educacao infantil",
    "pre-escola",
    "material didatico",
    "recurso pedagogico",
    "30 segundos",
    "sem login",
    "historico de atividades",
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
    title: "Crie atividade escolares alinhadas à BNCC a partir de um tema — prontas para imprimir — em 30 segundos. Sem login. 3 atividades gratuitas por dia. Acesse educando.app",
    description:
      "Com o educando.app, você transforma qualquer tema em atividades pedagógicas completas, com códigos da BNCC e prontas para imprimir. Tudo em segundos, direto no navegador e sem necessidade de login. Recupere seu tempo livre e garanta aulas criativas hoje mesmo!",
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
    title: "Crie atividade escolares alinhadas à BNCC a partir de um tema — prontas para imprimir — em 30 segundos. Sem login. 3 atividades gratuitas por dia. Acesse educando.app",
    description:
      "Com o educando.app, você transforma qualquer tema em atividades pedagógicas completas, com códigos da BNCC e prontas para imprimir. Tudo em segundos, direto no navegador e sem necessidade de login. Recupere seu tempo livre e garanta aulas criativas hoje mesmo!",
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
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
