import type React from "react"
import type { Metadata, Viewport } from "next"
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ClarityAnalytics } from "@/components/clarity-analytics"
import { ConsentBanner } from "@/components/consent-banner"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthGateProvider } from "@/components/auth/auth-gate-provider"
import { createSSRServerClient, getCurrentUser } from "@/lib/supabase/ssr-server"
import { getSubscriptionState } from "@/lib/subscriptions"
import { SITE_URL, SITE_NAME } from "@/lib/site-config"
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

const TITLE = "educando.app — Atividades prontas para sua turma a 1-click"
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
    "gerar atividade",
    "plano de aula personalizado",
    "atividades com IA",
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
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/opengraph-image", alt: "educando.app — Diretório pedagógico alinhado à BNCC" }],
  },
  alternates: {
    canonical: SITE_URL,
  },
  other: {
    "p:domain_verify": "660f47cc8dc7dd8550956bf49ec4188b",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createSSRServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [premiumState, totalRes] = await Promise.all([
    user ? getSubscriptionState(supabase, user.id) : Promise.resolve({ isPremium: false }),
    supabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .is("user_id", null),
  ])

  const isPremium = premiumState.isPremium
  const activityTotal = totalRes.count ?? 0

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
        <AuthGateProvider
          initialUser={user}
          initialIsPremium={isPremium}
          initialActivityTotal={activityTotal}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
          <ConsentBanner />
          <Analytics />
          <ClarityAnalytics />
        </AuthGateProvider>
      </body>
    </html>
  )
}
