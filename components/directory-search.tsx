"use client"

import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useId } from "react"

interface DirectorySearchProps {
  value: string
  onChange: (value: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function DirectorySearch({
  value,
  onChange,
  isLoading = false,
  placeholder = "Busque por tema, título ou código BNCC (ex.: EF01MA08)",
}: DirectorySearchProps) {
  const inputId = useId()
  return (
    <div className="relative">
      <label htmlFor={inputId} className="sr-only">
        Buscar materiais
      </label>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-amber-600">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Search className="h-5 w-5" aria-hidden />
        )}
      </div>
      <Input
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-14 rounded-full border-amber-200 bg-white pl-12 pr-4 text-base shadow-sm focus-visible:border-amber-400 focus-visible:ring-amber-400/50"
      />
    </div>
  )
}
