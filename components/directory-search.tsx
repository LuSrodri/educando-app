"use client"

import { FormEvent, useId } from "react"
import { Loader2, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface DirectorySearchProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  onClear?: () => void
  isLoading?: boolean
  hasActiveQuery?: boolean
  placeholder?: string
}

export function DirectorySearch({
  value,
  onChange,
  onSubmit,
  onClear,
  isLoading = false,
  hasActiveQuery = false,
  placeholder = "Busque por tema, título ou código BNCC (ex.: EF01MA08)",
}: DirectorySearchProps) {
  const inputId = useId()
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(value)
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-2" role="search">
      <label htmlFor={inputId} className="sr-only">
        Buscar materiais
      </label>
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-amber-600">
          <Search className="h-5 w-5" aria-hidden />
        </div>
        <Input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={160}
          enterKeyHint="search"
          className="h-14 rounded-full border-amber-200 bg-white pl-12 pr-12 text-base shadow-sm focus-visible:border-amber-400 focus-visible:ring-amber-400/50"
        />
        {hasActiveQuery && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute inset-y-0 right-3 my-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Limpar busca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button
        type="submit"
        disabled={isLoading || value.trim().length === 0}
        className="h-14 cursor-pointer rounded-full bg-amber-500 px-5 text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Buscando
          </>
        ) : (
          <>
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </>
        )}
      </Button>
    </form>
  )
}
