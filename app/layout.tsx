import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ConsentBanner } from "@/components/consent-banner"
import { ErrorBoundary } from "@/components/error-boundary"
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
    default: "educando.app — Crie atividades escolares com IA em 30 segundos. 5 por dia, grátis.",
    template: "%s | educando.app",
  },
  description:
    "Com o educando.app, você transforma qualquer tema em atividades pedagógicas completas, com códigos da BNCC e prontas para imprimir. Tudo em segundos, direto no navegador e sem necessidade de login.",
  keywords: [
    "gerador de atividades",
    "atividades escolares",
    "ensino fundamental",
    "BNCC",
    "alfabetização",
    "atividades para imprimir",
    "professor",
    "educação",
    "inteligência artificial",
    "IA educação",
    "material didático",
    "recurso pedagógico",
    "30 segundos",
    "sem login",
    "grátis",
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
      "Transforme qualquer tema em atividades pedagógicas completas, alinhadas à BNCC e prontas para imprimir. 5 atividades grátis por dia!",
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
      "Transforme qualquer tema em atividades pedagógicas completas, alinhadas à BNCC e prontas para imprimir.",
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

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "educando.app",
  url: "https://educando.app",
  description:
    "Gerador de atividades escolares com inteligência artificial, alinhadas à BNCC. Grátis, sem login.",
  publisher: {
    "@type": "Organization",
    name: "educando.app",
    url: "https://educando.app",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  )
}
