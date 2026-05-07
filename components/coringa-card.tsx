"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { getActivityThumbnailUrl } from "@/lib/image-utils"

interface CoringaCardProps {
  imagePath: string
  tema: string
  bnccCodes?: string[]
}

export function CoringaCard({ imagePath, tema, bnccCodes }: CoringaCardProps) {
  const href = `/sejamembro?tema=${encodeURIComponent(tema)}`

  return (
    <Link
      href={href}
      prefetch={false}
      target="_blank"
      rel="noopener"
      className="group focus:outline-none"
    >
      <Card className="h-full overflow-hidden border border-gray-100 bg-white transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-amber-300 group-hover:shadow-md group-focus-visible:border-amber-500">
        <CardContent className="p-0">
          <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
            <img
              src={getActivityThumbnailUrl(imagePath, 440)}
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-110 object-cover blur-md"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors duration-300 group-hover:bg-black/25">
              <div className="translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-lg">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  Personalizar
                </div>
              </div>
            </div>
            <span className="absolute right-2 top-2 rounded-full bg-gray-900/70 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm">
              Premium
            </span>
          </div>
          <div className="space-y-1.5 p-3 sm:p-4">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 sm:text-[15px]">
              Atividade personalizada para {tema}
            </p>
            <p className="line-clamp-1 text-xs text-gray-500 sm:text-[13px]">
              {tema}
            </p>
            {bnccCodes && bnccCodes.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {bnccCodes.slice(0, 3).map((code) => (
                  <span
                    key={code}
                    className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-700"
                  >
                    {code}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
