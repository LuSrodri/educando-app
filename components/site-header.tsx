import Image from "next/image"
import Link from "next/link"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-100/70 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="educando.app — início">
          <Image
            src="/images/educando-app-logo.png"
            alt="educando.app"
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="font-heading text-lg font-semibold tracking-tight text-gray-900">
            educando<span className="text-amber-600">.app</span>
          </span>
        </Link>
      </div>
    </header>
  )
}
