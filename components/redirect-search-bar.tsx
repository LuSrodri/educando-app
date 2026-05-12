"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { DirectorySearch } from "@/components/directory-search"

export function RedirectSearchBar() {
  const router = useRouter()
  const [value, setValue] = useState("")

  const handleSubmit = useCallback(
    (raw: string) => {
      const q = raw.trim()
      if (!q) return
      router.push(`/buscar?tema=${encodeURIComponent(q)}`)
    },
    [router],
  )

  const handleClear = useCallback(() => {
    setValue("")
  }, [])

  return (
    <DirectorySearch
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      onClear={handleClear}
      hasActiveQuery={Boolean(value)}
    />
  )
}
