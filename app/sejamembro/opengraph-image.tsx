import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #f59e0b 0%, #d97706 100%)",
        padding: "0 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
        <div
          style={{
            width: 48,
            height: 48,
            background: "rgba(255,255,255,0.2)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1.5px solid rgba(255,255,255,0.4)",
          }}
        >
          <span style={{ color: "white", fontSize: 24, fontWeight: 900 }}>e</span>
        </div>
        <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.01em" }}>
          educando.app
        </span>
      </div>

      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          color: "white",
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          maxWidth: 900,
          marginBottom: 20,
        }}
      >
        Fichas pedagógicas personalizadas em 60 segundos
      </div>

      <div
        style={{
          fontSize: 22,
          color: "rgba(255,255,255,0.85)",
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.5,
          marginBottom: 40,
        }}
      >
        Alinhadas à BNCC, com referências culturais brasileiras — geradas por IA em menos de 1 minuto
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1.5px solid rgba(255,255,255,0.35)",
            borderRadius: 100,
            padding: "8px 20px",
            fontSize: 15,
            fontWeight: 600,
            color: "white",
          }}
        >
          Sem assinatura
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1.5px solid rgba(255,255,255,0.35)",
            borderRadius: 100,
            padding: "8px 20px",
            fontSize: 15,
            fontWeight: 600,
            color: "white",
          }}
        >
          Pix
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1.5px solid rgba(255,255,255,0.35)",
            borderRadius: 100,
            padding: "8px 20px",
            fontSize: 15,
            fontWeight: 600,
            color: "white",
          }}
        >
          Licença pedagógica
        </div>
      </div>
    </div>,
    size,
  )
}
