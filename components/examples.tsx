"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Printer, Wand2, Share2, Eye } from "lucide-react"

const examples = [
  {
    title: "Alfabetização Fonética",
    description: "Atividade para alfabetizar crianças com alfabeto fonético",
    prompt:
      "Atividade de alfabetização fonética para 1º ano do ensino fundamental, com exercícios de identificação de sons iniciais, ligação entre desenhos e letras, e formação de sílabas",
    grade: "1º ano",
    category: "Português",
    level: "Fundamental I",
    image: "/images/atividade-escolar-20-282-29.png",
  },
  {
    title: "Fluência Leitora",
    description: "Exercícios de leitura para desenvolver fluência",
    prompt:
      "Atividade de fluência leitora para 3º ano com texto curto sobre animais da fauna brasileira, perguntas de interpretação e espaço para leitura em voz alta",
    grade: "3º ano",
    category: "Português",
    level: "Fundamental I",
    image: "/images/atividade-escolar-20-283-29.png",
  },
  {
    title: "Tabuada Divertida",
    description: "Atividade lúdica para praticar multiplicação",
    prompt:
      "Atividade de tabuada para 2º ano com problemas ilustrados usando animais brasileiros como tucano, capivara e mico-leão-dourado, relacionando adição repetida com multiplicação",
    grade: "2º ano",
    category: "Matemática",
    level: "Fundamental I",
    image: "/images/atividade-escolar-20-284-29.png",
  },
  {
    title: "Sistema Solar",
    description: "Conhecendo os planetas do nosso sistema solar",
    prompt:
      "Atividade sobre o Sistema Solar para 4º ano com exercícios de identificação dos planetas, ligação de características e curiosidades espaciais",
    grade: "4º ano",
    category: "Ciências",
    level: "Fundamental I",
    image: "/images/atividade-escolar-20-285-29.png",
  },
  {
    title: "Consciência Silábica",
    description: "Separação de sílabas e identificação de sons",
    prompt:
      "Atividade de consciência silábica para 1º ano com exercícios de separação de sílabas e descoberta do som inicial das palavras, usando elementos da cultura brasileira",
    grade: "1º ano",
    category: "Português",
    level: "Fundamental I",
    image: "/images/atividade-escolar-20-286-29.png",
  },
  {
    title: "Problemas Matemáticos",
    description: "Situações-problema do cotidiano brasileiro",
    prompt:
      "Atividade de problemas matemáticos para 5º ano com situações do cotidiano brasileiro como feira livre, festa junina e passeios turísticos, envolvendo operações com dinheiro e tempo",
    grade: "5º ano",
    category: "Matemática",
    level: "Fundamental I",
    image: "/images/atividade-escolar-20-287-29.png",
  },
]

const categoryColors: Record<string, string> = {
  Português: "bg-blue-100 text-blue-800",
  Matemática: "bg-green-100 text-green-800",
  Ciências: "bg-purple-100 text-purple-800",
  História: "bg-orange-100 text-orange-800",
  Geografia: "bg-teal-100 text-teal-800",
}

interface ExamplesProps {
  onSelectExample?: (prompt: string) => void
}

export function Examples({ onSelectExample }: ExamplesProps) {
  const [selectedExample, setSelectedExample] = useState<(typeof examples)[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleUseExample = (prompt: string) => {
    setIsModalOpen(false)
    if (onSelectExample) {
      onSelectExample(prompt)
    }
    const generatorSection = document.getElementById("gerador")
    if (generatorSection) {
      generatorSection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  const handleOpenExample = (example: (typeof examples)[0]) => {
    setSelectedExample(example)
    setIsModalOpen(true)
  }

  const downloadExampleImage = (imageSrc: string, title: string) => {
    const link = document.createElement("a")
    link.href = imageSrc
    link.download = `atividade-${title.toLowerCase().replace(/\s+/g, "-")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printExampleImage = (imageSrc: string) => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Atividade Escolar</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${imageSrc}" onload="window.print(); window.close();" />
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const shareExample = async (imageSrc: string) => {
    const shareText = "Criei essa atividade em 30 segundos! Professores, usem: https://educando.app"

    try {
      const response = await fetch(imageSrc)
      const blob = await response.blob()
      const file = new File([blob], "atividade-escolar.png", { type: "image/png" })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Atividade Escolar - educando.app",
          text: shareText,
          files: [file],
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        alert("Link copiado! Cole nas suas redes sociais junto com a imagem.")
      }
    } catch (err) {
      await navigator.clipboard.writeText(shareText)
      alert("Link copiado! Cole nas suas redes sociais.")
    }
  }

  return (
    <section className="py-16 bg-amber-50/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Exemplos de Atividades</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Baixe e use agora, ou use como inspiração para criar sua própria atividade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {examples.map((example, index) => (
            <Card key={index} className="overflow-hidden hover:shadow-lg transition-all group">
              <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                <img
                  src={example.image || "/placeholder.svg"}
                  alt={example.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {/* Overlay com ações rápidas */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenExample(example)}
                    className="bg-white hover:bg-gray-100"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Abrir
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => downloadExampleImage(example.image, example.title)}
                    className="bg-white hover:bg-gray-100"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className={categoryColors[example.category]}>
                    {example.category}
                  </Badge>
                  <Badge variant="outline">{example.grade}</Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{example.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{example.description}</p>

                {/* Botões de ação */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUseExample(example.prompt)}
                    className="flex-1 text-amber-700 border-amber-300 hover:bg-amber-50"
                  >
                    <Wand2 className="w-4 h-4 mr-1" />
                    Criar similar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadExampleImage(example.image, example.title)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal para visualizar exemplo */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedExample && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedExample.title}
                  <Badge variant="secondary" className={categoryColors[selectedExample.category]}>
                    {selectedExample.category}
                  </Badge>
                  <Badge variant="outline">{selectedExample.grade}</Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4">
                <img
                  src={selectedExample.image || "/placeholder.svg"}
                  alt={selectedExample.title}
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button onClick={() => downloadExampleImage(selectedExample.image, selectedExample.title)}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
                <Button variant="outline" onClick={() => printExampleImage(selectedExample.image)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUseExample(selectedExample.prompt)}
                  className="text-amber-700 border-amber-300 hover:bg-amber-50"
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Criar similar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => shareExample(selectedExample.image)}
                  className="text-pink-700 border-pink-300 hover:bg-pink-50"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
