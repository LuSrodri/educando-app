"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface PinterestSaveButtonProps {
  activityUrl: string
  imageUrl: string
  description: string
  size?: "default" | "sm"
}

export function PinterestSaveButton({ activityUrl, imageUrl, description, size = "default" }: PinterestSaveButtonProps) {

  description = `"${description.split("\n", 6)} [...]" — gerada por educando.app 🎓 #atividadeescolar #educação #ensino #aprendizado`

  return (
    <a
      href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(activityUrl)}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(description)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        buttonVariants({ variant: "outline", size: size }),
        "text-[#E60023] border-[#E60023]/40 hover:bg-[#E60023]/10 hover:text-[#E60023]"
      )}
    >
      <Image src="/images/pinterest-icon.png" alt="Pinterest" width={14} height={14} className="shrink-0" />
      Salvar no Pinterest
    </a>
  )
}
