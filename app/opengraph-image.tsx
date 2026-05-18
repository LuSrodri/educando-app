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
        background: "linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%)",
        padding: "0 80px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36 }}>
        <div
          style={{
            width: 52,
            height: 52,
            background: "#f59e0b",
            borderRadius: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "white", fontSize: 26, fontWeight: 900 }}>e</span>
        </div>
        <span style={{ fontSize: 28, fontWeight: 700, color: "#1f2937", letterSpacing: "-0.01em" }}>
          educando.app
        </span>
      </div>

      <div
        style={{
          fontSize: 56,
          fontWeight: 900,
          color: "#111827",
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          maxWidth: 900,
          marginBottom: 24,
        }}
      >
        Atividades prontas para sua turma a 1-click
      </div>

      <div
        style={{
          fontSize: 24,
          color: "#4b5563",
          textAlign: "center",
          maxWidth: 680,
          lineHeight: 1.5,
          marginBottom: 40,
        }}
      >
        Diretório pedagógico alinhado à BNCC para professores brasileiros
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div
          style={{
            background: "white",
            border: "1.5px solid #fcd34d",
            borderRadius: 100,
            padding: "8px 20px",
            fontSize: 16,
            fontWeight: 600,
            color: "#92400e",
          }}
        >
          Alinhado à BNCC
        </div>
        <div
          style={{
            background: "white",
            border: "1.5px solid #fcd34d",
            borderRadius: 100,
            padding: "8px 20px",
            fontSize: 16,
            fontWeight: 600,
            color: "#92400e",
          }}
        >
          Para professores
        </div>
      </div>
    </div>,
    size,
  )
}
