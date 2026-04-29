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

const SITE_URL = "https://educando.app"
const SITE_NAME = "educando.app"
const TITLE = "educando.app — O seu plano de aula a 1-click"
const DESCRIPTION =
  "Diretório de atividades e materiais de apoio pedagógicos alinhados à BNCC. Encontre em 1 click o material ideal para a sua próxima aula."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | educando.app",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  keywords: [
    "atividades escolares",
    "planos de aula",
    "materiais de apoio",
    "BNCC",
    "Base Nacional Comum Curricular",
    "alfabetização",
    "ensino fundamental",
    "ensino médio",
    "educação infantil",
    "matemática",
    "português",
    "ciências",
    "professor",
    "recurso pedagógico",
    "pt-BR",
  ],
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
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/images/educando-app-logo.png",
        width: 1024,
        height: 1024,
        alt: "educando.app — Diretório pedagógico alinhado à BNCC",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/educando-app-logo.png"],
  },
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    "theme-color": "#f59e0b",
  },
}

export const viewport: Viewport = {
  themeColor: "#f59e0b",
  width: "device-width",
  initialScale: 1,
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DESCRIPTION,
  inLanguage: "pt-BR",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/?q={search_term_string}#materiais`,
    },
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/images/educando-app-logo.png`,
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
        <link rel="preconnect" href="https://challenges.cloudflare.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <ErrorBoundary>{children}</ErrorBoundary>
        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  )
}
