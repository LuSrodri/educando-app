import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "educando.app — Diretório pedagógico alinhado à BNCC",
    short_name: "educando.app",
    description:
      "Diretório de atividades e materiais de apoio pedagógicos alinhados à BNCC.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffbeb",
    theme_color: "#f59e0b",
    icons: [
      {
        src: "/images/educando-app-logo.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
    lang: "pt-BR",
    orientation: "portrait",
  }
}
